/**
 * Seed de exemplo para a fase 1.
 * Cria: 1 admin (mentor), 3 trilhas com módulos, 2 aulas em rascunho (sem vídeo) e 3 membros.
 * Uso: npm run seed  (precisa de SUPABASE_SERVICE_ROLE_KEY e DATABASE_URL no .env)
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "mentor@avix.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "avix-mentor-2026";
const MEMBER_PASSWORD = process.env.SEED_MEMBER_PASSWORD ?? "avix-aluno-2026";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 2 });
const db = drizzle(sql, { schema });

async function ensureAuthUser(email: string, password: string, meta: Record<string, string>) {
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, { password, user_metadata: meta, email_confirm: true });
    return existing.id;
  }
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: meta });
  if (error || !data.user) throw error ?? new Error("createUser falhou");
  return data.user.id;
}

async function main() {
  console.log("→ Admin");
  const adminId = await ensureAuthUser(ADMIN_EMAIL, ADMIN_PASSWORD, { name: "Mentor Avix", role: "admin" });
  await db.insert(schema.users).values({ id: adminId, email: ADMIN_EMAIL, name: "Mentor Avix", role: "admin" }).onConflictDoUpdate({ target: schema.users.id, set: { role: "admin", name: "Mentor Avix" } });

  console.log("→ Trilhas e módulos");
  const trackDefs = [
    { name: "Marketing", slug: "marketing", description: "Posicionamento, oferta, conteúdo e tráfego para atrair as pessoas certas.", modules: ["Fundamentos", "Oferta e posicionamento", "Conteúdo e tráfego"] },
    { name: "Vendas", slug: "vendas", description: "Do primeiro contato ao fechamento: roteiro, objeções e acompanhamento.", modules: ["Fundamentos", "Roteiro e objeções", "Follow-up e fechamento"] },
    { name: "Tecnologia", slug: "tecnologia", description: "Ferramentas que fazem marketing e vendas rodarem sem depender de você.", modules: ["Fundamentos", "CRM e automação", "Dados e integrações"] },
  ];
  const trackIds: Record<string, string> = {};
  for (const [i, t] of trackDefs.entries()) {
    const [row] = await db
      .insert(schema.tracks)
      .values({ name: t.name, slug: t.slug, description: t.description, order: i })
      .onConflictDoUpdate({ target: schema.tracks.slug, set: { name: t.name, description: t.description, order: i } })
      .returning({ id: schema.tracks.id });
    trackIds[t.slug] = row!.id;
    const existing = await db.query.modules.findMany({ where: eq(schema.modules.trackId, row!.id) });
    if (existing.length === 0) await db.insert(schema.modules).values(t.modules.map((title, j) => ({ trackId: row!.id, title, order: j })));
  }

  console.log("→ Aulas de exemplo (rascunho, sem vídeo)");
  const mkMod = await db.query.modules.findFirst({ where: eq(schema.modules.trackId, trackIds.marketing!), orderBy: (m, { asc }) => [asc(m.order)] });
  const existingLessons = await db.query.lessons.findMany({ where: eq(schema.lessons.moduleId, mkMod!.id) });
  if (existingLessons.length === 0) {
    await db.insert(schema.lessons).values([
      { moduleId: mkMod!.id, title: "Boas-vindas à trilha de Marketing", description: "Como esta trilha funciona e o que você deve fazer depois de cada aula.", order: 0, status: "rascunho" },
      { moduleId: mkMod!.id, title: "Oferta irresistível", description: "Como transformar o que você vende numa oferta que o cliente entende em 10 segundos: promessa, prova e condição.", order: 1, status: "rascunho" },
    ]);
  }

  console.log("→ Membros");
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const plus = (days: number) => new Date(today.getTime() + days * 864e5);
  const members = [
    { name: "Carla Mendes", email: "carla@exemplo.com.br", whatsapp: "+5527999990001", tracks: ["marketing", "vendas"], goals: "Dobrar os agendamentos da clínica até março com tráfego pago e uma oferta clara.", status: "ativo" as const, start: iso(plus(-30)), end: iso(plus(150)), onboarding: true },
    { name: "Rafael Teixeira", email: "rafael@exemplo.com.br", whatsapp: "+5527999990002", tracks: ["vendas"], goals: "Estruturar o roteiro de vendas e parar de depender de indicação.", status: "ativo" as const, start: iso(plus(-10)), end: iso(plus(170)), onboarding: false },
    { name: "Juliana Prado", email: "juliana@exemplo.com.br", whatsapp: "+5527999990003", tracks: ["marketing", "tecnologia"], goals: null, status: "expirado" as const, start: iso(plus(-200)), end: iso(plus(-20)), onboarding: true },
  ];
  for (const m of members) {
    const id = await ensureAuthUser(m.email, MEMBER_PASSWORD, { name: m.name, role: "membro" });
    await db.insert(schema.users).values({ id, email: m.email, name: m.name, role: "membro" }).onConflictDoUpdate({ target: schema.users.id, set: { name: m.name, role: "membro" } });
    await db
      .insert(schema.memberProfiles)
      .values({ userId: id, whatsappE164: m.whatsapp, goals: m.goals, accessStart: m.start, accessEnd: m.end, status: m.status, onboardingDone: m.onboarding, consentAcceptedAt: m.onboarding ? new Date() : null, inviteSentAt: new Date(), lastSeenAt: m.status === "ativo" ? plus(-1) : plus(-25) })
      .onConflictDoUpdate({ target: schema.memberProfiles.userId, set: { whatsappE164: m.whatsapp, status: m.status, accessStart: m.start, accessEnd: m.end, onboardingDone: m.onboarding } });
    await db.insert(schema.memberAvailability).values({ memberId: id, weekdays: [1, 2, 3, 5], hoursPerWeek: 6 }).onConflictDoNothing();
    await db.delete(schema.memberTracks).where(eq(schema.memberTracks.memberId, id));
    await db.insert(schema.memberTracks).values(m.tracks.map((s) => ({ memberId: id, trackId: trackIds[s]! })));
  }

  await db.insert(schema.announcements).values({ title: "Bem-vindos", body: "A plataforma está no ar. As aulas serão publicadas a partir das mentorias em grupo. Qualquer dúvida, me chame no WhatsApp.", createdBy: adminId }).onConflictDoNothing();

  console.log("\nPronto.");
  console.log(`Admin:   ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`Membros: carla@exemplo.com.br (ativa, onboarding feito) · rafael@exemplo.com.br (ativo, primeiro acesso) · juliana@exemplo.com.br (expirada) / senha ${MEMBER_PASSWORD}`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
