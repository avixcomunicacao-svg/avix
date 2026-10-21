"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, requireUser } from "@/modules/auth/session";
import { emailLayout, sendEmail } from "@/lib/email";
import { toE164 } from "@/lib/format";
import { getSettings } from "@/modules/settings/queries";

const { users, memberProfiles, memberTracks, memberAvailability, auditLogs } = schema;

export type ActionState = { error?: string; ok?: boolean; message?: string; fieldErrors?: Record<string, string> };

/* ---------------------------------------------------------------------------
 * Cadastro / edição (admin)
 * ------------------------------------------------------------------------- */
const memberSchema = z.object({
  name: z.string().trim().min(2, "Digite o nome completo."),
  email: z.string().trim().toLowerCase().email("Digite um e-mail completo, como carla@exemplo.com."),
  whatsapp: z.string().transform((v, ctx) => {
    const e = toE164(v);
    if (!e) ctx.addIssue({ code: "custom", message: "Use o formato com DDD, como (27) 99999-0000." });
    return e ?? "";
  }),
  accessStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data de início."),
  accessEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data de término."),
  goals: z.string().trim().optional(),
  notesPrivate: z.string().trim().optional(),
  isMadeClient: z.coerce.boolean().optional(),
  tracks: z.array(z.string().uuid()).default([]),
  sendInvite: z.coerce.boolean().optional(),
});

function parseMember(formData: FormData) {
  return memberSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    whatsapp: formData.get("whatsapp"),
    accessStart: formData.get("accessStart"),
    accessEnd: formData.get("accessEnd"),
    goals: formData.get("goals") ?? undefined,
    notesPrivate: formData.get("notesPrivate") ?? undefined,
    isMadeClient: formData.get("isMadeClient") === "on",
    tracks: formData.getAll("tracks").map(String),
    sendInvite: formData.get("sendInvite") === "on",
  });
}

function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "form");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

export async function createMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseMember(formData);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  if (d.accessEnd < d.accessStart) return { fieldErrors: { accessEnd: "O término precisa ser depois do início." } };

  const dupPhone = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.whatsappE164, d.whatsapp) });
  if (dupPhone) return { fieldErrors: { whatsapp: "Já existe um membro com este WhatsApp." } };

  const supabase = createSupabaseAdmin();
  // Cria o usuário no Auth sem enviar e-mail; o convite é enviado por nós (template próprio) se marcado.
  const { data: created, error } = await supabase.auth.admin.createUser({
    email: d.email,
    email_confirm: true,
    user_metadata: { name: d.name, role: "membro" },
  });
  if (error || !created.user) {
    if (error?.message?.toLowerCase().includes("already")) return { fieldErrors: { email: "Já existe uma conta com este e-mail." } };
    return { error: `Não foi possível criar a conta: ${error?.message ?? "erro desconhecido"}` };
  }
  const userId = created.user.id;

  await db.transaction(async (tx) => {
    // O trigger já criou public.users; garantimos nome/papel.
    await tx.insert(users).values({ id: userId, name: d.name, email: d.email, role: "membro" }).onConflictDoUpdate({ target: users.id, set: { name: d.name, role: "membro" } });
    await tx.insert(memberProfiles).values({
      userId,
      whatsappE164: d.whatsapp,
      goals: d.goals || null,
      notesPrivate: d.notesPrivate || null,
      accessStart: d.accessStart,
      accessEnd: d.accessEnd,
      isMadeClient: !!d.isMadeClient,
    });
    await tx.insert(memberAvailability).values({ memberId: userId });
    if (d.tracks.length) await tx.insert(memberTracks).values(d.tracks.map((trackId) => ({ memberId: userId, trackId })));
    await tx.insert(auditLogs).values({ actorId: admin.id, action: "member.create", targetType: "member", targetId: userId });
  });

  if (d.sendInvite) await sendInviteEmail(userId);

  revalidatePath("/admin/membros");
  redirect(`/admin/membros/${userId}?novo=1`);
}

export async function updateMember(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseMember(formData);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  if (d.accessEnd < d.accessStart) return { fieldErrors: { accessEnd: "O término precisa ser depois do início." } };

  const dupPhone = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.whatsappE164, d.whatsapp) });
  if (dupPhone && dupPhone.userId !== id) return { fieldErrors: { whatsapp: "Já existe um membro com este WhatsApp." } };

  const current = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!current) return { error: "Membro não encontrado." };
  if (current.email !== d.email) {
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.auth.admin.updateUserById(id, { email: d.email, email_confirm: true });
    if (error) return { fieldErrors: { email: "Não foi possível trocar o e-mail: " + error.message } };
  }

  await db.transaction(async (tx) => {
    await tx.update(users).set({ name: d.name, email: d.email }).where(eq(users.id, id));
    await tx
      .update(memberProfiles)
      .set({ whatsappE164: d.whatsapp, goals: d.goals || null, notesPrivate: d.notesPrivate || null, accessStart: d.accessStart, accessEnd: d.accessEnd, isMadeClient: !!d.isMadeClient })
      .where(eq(memberProfiles.userId, id));
    await tx.delete(memberTracks).where(eq(memberTracks.memberId, id));
    if (d.tracks.length) await tx.insert(memberTracks).values(d.tracks.map((trackId) => ({ memberId: id, trackId })));
    await tx.insert(auditLogs).values({ actorId: admin.id, action: "member.update", targetType: "member", targetId: id });
  });

  revalidatePath("/admin/membros");
  revalidatePath(`/admin/membros/${id}`);
  return { ok: true, message: "Dados salvos." };
}

export async function setMemberStatus(id: string, status: "ativo" | "pausado" | "expirado") {
  const admin = await requireAdmin();
  await db.update(memberProfiles).set({ status }).where(eq(memberProfiles.userId, id));
  await db.insert(auditLogs).values({ actorId: admin.id, action: `member.status.${status}`, targetType: "member", targetId: id });
  revalidatePath("/admin/membros");
  revalidatePath(`/admin/membros/${id}`);
}

export async function updatePrivateNotes(id: string, notes: string) {
  await requireAdmin();
  await db.update(memberProfiles).set({ notesPrivate: notes.trim() || null }).where(eq(memberProfiles.userId, id));
  revalidatePath(`/admin/membros/${id}`);
}

/* ---------------------------------------------------------------------------
 * Convite
 * ------------------------------------------------------------------------- */
export async function sendInviteEmail(userId: string): Promise<ActionState> {
  await requireAdmin();
  const [u, settings] = await Promise.all([db.query.users.findFirst({ where: eq(users.id, userId) }), getSettings()]);
  if (!u) return { error: "Membro não encontrado." };

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: u.email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/convite` },
  });
  if (error || !data.properties?.action_link) return { error: "Não foi possível gerar o link de convite: " + (error?.message ?? "") };

  // Link próprio pelo callback (token_hash) para não depender do template do Supabase.
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?token_hash=${data.properties.hashed_token}&type=magiclink&next=/convite`;

  const r = await sendEmail({
    to: u.email,
    subject: `Seu acesso à ${settings.brand.name}`,
    html: emailLayout({
      brand: settings.brand.name,
      title: `Bem-vindo(a), ${u.name.split(" ")[0]}!`,
      intro: "Seu acesso à mentoria está pronto. Clique no botão para criar sua senha e entrar. O link vale por 24 horas.",
      cta: { label: "Criar minha senha", url: link },
      footer: "Se você não esperava este e-mail, pode ignorá-lo.",
    }),
    text: `Seu acesso à ${settings.brand.name} está pronto. Crie sua senha em: ${link}`,
  });
  if (!r.ok) return { error: r.error ?? "Falha ao enviar o e-mail." };

  await db.update(memberProfiles).set({ inviteSentAt: new Date() }).where(eq(memberProfiles.userId, userId));
  revalidatePath(`/admin/membros/${userId}`);
  revalidatePath("/admin/membros");
  return { ok: true, message: "Convite enviado." };
}

export async function resendInvite(userId: string): Promise<ActionState> {
  return sendInviteEmail(userId);
}

/* ---------------------------------------------------------------------------
 * Onboarding e perfil (membro)
 * ------------------------------------------------------------------------- */
const onboardingSchema = z.object({
  goals: z.string().trim().min(10, "Conte um pouco mais — pelo menos uma frase."),
  weekdays: z.array(z.coerce.number().int().min(0).max(6)).min(1, "Escolha pelo menos um dia."),
  hoursPerWeek: z.coerce.number().int().min(1, "Pelo menos 1 hora.").max(40, "No máximo 40 horas."),
  consent: z.literal("on", { message: "Precisamos do seu aceite para continuar." }),
});

export async function completeOnboarding(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = onboardingSchema.safeParse({
    goals: formData.get("goals"),
    weekdays: formData.getAll("weekdays"),
    hoursPerWeek: formData.get("hoursPerWeek"),
    consent: formData.get("consent"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  await db.transaction(async (tx) => {
    await tx.update(memberProfiles).set({ goals: d.goals, onboardingDone: true, consentAcceptedAt: new Date() }).where(eq(memberProfiles.userId, user.id));
    await tx
      .insert(memberAvailability)
      .values({ memberId: user.id, weekdays: d.weekdays, hoursPerWeek: d.hoursPerWeek })
      .onConflictDoUpdate({ target: memberAvailability.memberId, set: { weekdays: d.weekdays, hoursPerWeek: d.hoursPerWeek } });
  });
  redirect("/app");
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Digite seu nome."),
  goals: z.string().trim().optional(),
  weekdays: z.array(z.coerce.number().int().min(0).max(6)).min(1, "Escolha pelo menos um dia."),
  hoursPerWeek: z.coerce.number().int().min(1).max(40),
  agendaTime: z.string().regex(/^\d{2}:\d{2}$/, "Informe um horário, como 07:00."),
  agendaWhatsapp: z.coerce.boolean(),
  agendaEmail: z.coerce.boolean(),
});

export async function updateMyProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    goals: formData.get("goals") ?? "",
    weekdays: formData.getAll("weekdays"),
    hoursPerWeek: formData.get("hoursPerWeek"),
    agendaTime: formData.get("agendaTime"),
    agendaWhatsapp: formData.get("agendaWhatsapp") === "on",
    agendaEmail: formData.get("agendaEmail") === "on",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  await db.transaction(async (tx) => {
    await tx.update(users).set({ name: d.name }).where(eq(users.id, user.id));
    await tx
      .update(memberProfiles)
      .set({ goals: d.goals || null, agendaTime: d.agendaTime, agendaChannels: { whatsapp: d.agendaWhatsapp, email: d.agendaEmail } })
      .where(eq(memberProfiles.userId, user.id));
    await tx
      .insert(memberAvailability)
      .values({ memberId: user.id, weekdays: d.weekdays, hoursPerWeek: d.hoursPerWeek })
      .onConflictDoUpdate({ target: memberAvailability.memberId, set: { weekdays: d.weekdays, hoursPerWeek: d.hoursPerWeek } });
  });
  revalidatePath("/app/perfil");
  return { ok: true, message: "Perfil salvo." };
}
