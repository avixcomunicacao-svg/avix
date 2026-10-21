"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin, requireMember } from "@/modules/auth/session";
import { slugify } from "@/lib/format";
import * as bunny from "@/lib/video/bunny";
import { createSupabaseServer } from "@/lib/supabase/server";

const { tracks, modules, lessons, lessonMaterials, auditLogs } = schema;
export type ActionState = { error?: string; ok?: boolean; message?: string; fieldErrors?: Record<string, string> };

function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "form");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

async function revalidateContent(extra: string[] = []) {
  for (const p of ["/admin/conteudos", "/admin", "/app", "/app/aulas", ...extra]) revalidatePath(p);
}

/* ---------------------------------------------------------------------------
 * Trilhas
 * ------------------------------------------------------------------------- */
const trackSchema = z.object({ name: z.string().trim().min(2, "Dê um nome à trilha."), description: z.string().trim().optional() });

export async function createTrack(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = trackSchema.safeParse({ name: fd.get("name"), description: fd.get("description") ?? "" });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const base = slugify(parsed.data.name);
  const existing = await db.query.tracks.findFirst({ where: eq(tracks.slug, base) });
  const slug = existing ? `${base}-${Date.now().toString(36)}` : base;
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max("order"), -1)`.mapWith(Number) }).from(tracks);
  await db.insert(tracks).values({ name: parsed.data.name, slug, description: parsed.data.description || null, order: max + 1 });
  await revalidateContent();
  return { ok: true, message: "Trilha criada." };
}

export async function updateTrack(id: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = trackSchema.safeParse({ name: fd.get("name"), description: fd.get("description") ?? "" });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  await db.update(tracks).set({ name: parsed.data.name, description: parsed.data.description || null }).where(eq(tracks.id, id));
  await revalidateContent();
  return { ok: true, message: "Trilha salva." };
}

export async function deleteTrack(id: string) {
  const admin = await requireAdmin();
  const t = await db.query.tracks.findFirst({ where: eq(tracks.id, id), with: { modules: { columns: { id: true } } } });
  if (!t) return;
  if (t.modules.length) throw new Error("Remova os módulos antes de excluir a trilha.");
  await db.delete(tracks).where(eq(tracks.id, id));
  await db.insert(auditLogs).values({ actorId: admin.id, action: "track.delete", targetType: "track", targetId: id, diff: { name: t.name } });
  await revalidateContent();
}

/* ---------------------------------------------------------------------------
 * Módulos
 * ------------------------------------------------------------------------- */
const moduleSchema = z.object({ trackId: z.string().uuid(), title: z.string().trim().min(2, "Dê um título ao módulo."), description: z.string().trim().optional() });

export async function createModule(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = moduleSchema.safeParse({ trackId: fd.get("trackId"), title: fd.get("title"), description: fd.get("description") ?? "" });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max("order"), -1)`.mapWith(Number) }).from(modules).where(eq(modules.trackId, parsed.data.trackId));
  await db.insert(modules).values({ trackId: parsed.data.trackId, title: parsed.data.title, description: parsed.data.description || null, order: max + 1 });
  await revalidateContent();
  return { ok: true, message: "Módulo criado." };
}

export async function updateModule(id: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z.object({ title: z.string().trim().min(2, "Dê um título ao módulo."), description: z.string().trim().optional() }).safeParse({ title: fd.get("title"), description: fd.get("description") ?? "" });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  await db.update(modules).set({ title: parsed.data.title, description: parsed.data.description || null }).where(eq(modules.id, id));
  await revalidateContent();
  return { ok: true, message: "Módulo salvo." };
}

export async function deleteModule(id: string) {
  await requireAdmin();
  const m = await db.query.modules.findFirst({ where: eq(modules.id, id), with: { lessons: { columns: { id: true } } } });
  if (!m) return;
  if (m.lessons.length) throw new Error("Remova as aulas antes de excluir o módulo.");
  await db.delete(modules).where(eq(modules.id, id));
  await revalidateContent();
}

/* ---------------------------------------------------------------------------
 * Reordenação (arrastar e soltar)
 * ------------------------------------------------------------------------- */
export async function reorder(kind: "tracks" | "modules" | "lessons", orderedIds: string[]) {
  await requireAdmin();
  const table = kind === "tracks" ? tracks : kind === "modules" ? modules : lessons;
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) await tx.update(table).set({ order: i }).where(eq(table.id, orderedIds[i]!));
  });
  await revalidateContent();
}

export async function moveLesson(lessonId: string, moduleId: string) {
  await requireAdmin();
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max("order"), -1)`.mapWith(Number) }).from(lessons).where(eq(lessons.moduleId, moduleId));
  await db.update(lessons).set({ moduleId, order: max + 1 }).where(eq(lessons.id, lessonId));
  await revalidateContent();
}

/* ---------------------------------------------------------------------------
 * Aulas
 * ------------------------------------------------------------------------- */
const lessonSchema = z.object({
  moduleId: z.string().uuid("Escolha o módulo."),
  title: z.string().trim().min(2, "Dê um título à aula."),
  description: z.string().trim().optional(),
  status: z.enum(["rascunho", "publicada"]),
  releaseMode: z.enum(["imediata", "data", "dias"]),
  releaseAt: z.string().optional(),
  releaseAfterDays: z.coerce.number().int().min(0).optional(),
  materials: z
    .array(z.object({ id: z.string().optional(), type: z.enum(["file", "link"]), label: z.string().trim().min(1), url: z.string().trim().url("Link inválido.") }))
    .default([]),
});

function parseLesson(fd: FormData) {
  let materials: unknown = [];
  try {
    materials = JSON.parse(String(fd.get("materials") || "[]"));
  } catch {
    materials = [];
  }
  return lessonSchema.safeParse({
    moduleId: fd.get("moduleId"),
    title: fd.get("title"),
    description: fd.get("description") ?? "",
    status: fd.get("status") ?? "rascunho",
    releaseMode: fd.get("releaseMode") ?? "imediata",
    releaseAt: fd.get("releaseAt") || undefined,
    releaseAfterDays: fd.get("releaseAfterDays") || undefined,
    materials,
  });
}

function releaseFields(d: z.infer<typeof lessonSchema>) {
  return {
    releaseAt: d.releaseMode === "data" && d.releaseAt ? new Date(d.releaseAt) : null,
    releaseAfterDays: d.releaseMode === "dias" ? (d.releaseAfterDays ?? 0) : null,
  };
}

export async function createLesson(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseLesson(fd);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max("order"), -1)`.mapWith(Number) }).from(lessons).where(eq(lessons.moduleId, d.moduleId));
  const [row] = await db
    .insert(lessons)
    .values({ moduleId: d.moduleId, title: d.title, description: d.description || null, status: d.status, order: max + 1, ...releaseFields(d) })
    .returning({ id: lessons.id });
  if (d.materials.length) await db.insert(lessonMaterials).values(d.materials.map((m, i) => ({ lessonId: row!.id, type: m.type, label: m.label, url: m.url, order: i })));
  await db.insert(auditLogs).values({ actorId: admin.id, action: "lesson.create", targetType: "lesson", targetId: row!.id });
  await revalidateContent();
  redirect(`/admin/conteudos/aulas/${row!.id}`);
}

export async function updateLesson(id: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseLesson(fd);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  await db.transaction(async (tx) => {
    await tx.update(lessons).set({ moduleId: d.moduleId, title: d.title, description: d.description || null, status: d.status, ...releaseFields(d) }).where(eq(lessons.id, id));
    await tx.delete(lessonMaterials).where(eq(lessonMaterials.lessonId, id));
    if (d.materials.length) await tx.insert(lessonMaterials).values(d.materials.map((m, i) => ({ lessonId: id, type: m.type, label: m.label, url: m.url, order: i })));
    await tx.insert(auditLogs).values({ actorId: admin.id, action: "lesson.update", targetType: "lesson", targetId: id });
  });
  await revalidateContent([`/admin/conteudos/aulas/${id}`, `/app/aulas/${id}`]);
  return { ok: true, message: d.status === "publicada" ? "Aula publicada." : "Rascunho salvo." };
}

export async function setLessonStatus(id: string, status: "rascunho" | "publicada") {
  await requireAdmin();
  await db.update(lessons).set({ status }).where(eq(lessons.id, id));
  await revalidateContent([`/admin/conteudos/aulas/${id}`]);
}

export async function deleteLesson(id: string) {
  const admin = await requireAdmin();
  const l = await db.query.lessons.findFirst({ where: eq(lessons.id, id) });
  if (!l) return;
  if (l.videoId && bunny.bunnyConfigured()) await bunny.deleteVideo(l.videoId).catch(() => {});
  await db.delete(lessons).where(eq(lessons.id, id));
  await db.insert(auditLogs).values({ actorId: admin.id, action: "lesson.delete", targetType: "lesson", targetId: id, diff: { title: l.title } });
  await revalidateContent();
  redirect("/admin/conteudos");
}

/* ---------------------------------------------------------------------------
 * Vídeo (Bunny)
 * ------------------------------------------------------------------------- */
export async function beginVideoUpload(lessonId: string, fileName: string) {
  await requireAdmin();
  if (!bunny.bunnyConfigured()) return { error: "Bunny Stream não configurado. Preencha BUNNY_LIBRARY_ID, BUNNY_API_KEY e BUNNY_TOKEN_KEY." as const };
  const l = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) });
  if (!l) return { error: "Aula não encontrada." as const };
  if (l.videoId) await bunny.deleteVideo(l.videoId).catch(() => {});
  const { videoId } = await bunny.createVideo(`${l.title} — ${fileName}`);
  await db.update(lessons).set({ videoId, videoProvider: "bunny", videoStatus: "aguardando", durationSec: null }).where(eq(lessons.id, lessonId));
  return { creds: bunny.tusCredentials(videoId) };
}

export async function markVideoUploaded(lessonId: string) {
  await requireAdmin();
  await db.update(lessons).set({ videoStatus: "processando" }).where(eq(lessons.id, lessonId));
  await revalidateContent([`/admin/conteudos/aulas/${lessonId}`]);
}

/** Consulta o Bunny e atualiza status/duração. Chamado pelo admin (botão/poll) e pelo cron. */
export async function syncVideoStatus(lessonId: string) {
  await requireAdmin();
  const l = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) });
  if (!l?.videoId || !bunny.bunnyConfigured()) return { status: l?.videoStatus ?? "aguardando" };
  const v = await bunny.getVideo(l.videoId);
  if (!v) return { status: "erro" as const };
  const status = bunny.mapStatus(v.status);
  await db.update(lessons).set({ videoStatus: status, durationSec: v.length || l.durationSec }).where(eq(lessons.id, lessonId));
  if (status === "pronto") await revalidateContent([`/admin/conteudos/aulas/${lessonId}`, `/app/aulas/${lessonId}`]);
  return { status, progress: v.encodeProgress, durationSec: v.length };
}

export async function removeVideo(lessonId: string) {
  await requireAdmin();
  const l = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) });
  if (l?.videoId && bunny.bunnyConfigured()) await bunny.deleteVideo(l.videoId).catch(() => {});
  await db.update(lessons).set({ videoId: null, videoStatus: "aguardando", durationSec: null }).where(eq(lessons.id, lessonId));
  await revalidateContent([`/admin/conteudos/aulas/${lessonId}`]);
}

/* ---------------------------------------------------------------------------
 * Progresso e avaliação (membro) — via sessão Supabase, RLS garante o escopo
 * ------------------------------------------------------------------------- */
export async function saveProgress(lessonId: string, positionSec: number) {
  const { user } = await requireMember();
  const supabase = await createSupabaseServer();
  await supabase.from("lesson_progress").upsert(
    { member_id: user.id, lesson_id: lessonId, position_sec: Math.max(0, Math.floor(positionSec)), last_watched_at: new Date().toISOString() },
    { onConflict: "member_id,lesson_id" },
  );
}

export async function toggleLessonCompleted(lessonId: string, completed: boolean) {
  const { user } = await requireMember();
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("lesson_progress").upsert(
    { member_id: user.id, lesson_id: lessonId, completed_at: completed ? new Date().toISOString() : null, last_watched_at: new Date().toISOString() },
    { onConflict: "member_id,lesson_id" },
  );
  if (error) return { error: "Não foi possível salvar. Tente de novo." };
  revalidatePath("/app");
  revalidatePath("/app/aulas");
  revalidatePath(`/app/aulas/${lessonId}`);
  return { ok: true };
}

export async function rateLesson(lessonId: string, score: number, comment: string) {
  const { user } = await requireMember();
  if (score < 1 || score > 5) return { error: "Escolha de 1 a 5 estrelas." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("ratings").upsert(
    { member_id: user.id, target_type: "lesson", target_id: lessonId, score, comment: comment.trim() || null },
    { onConflict: "member_id,target_type,target_id" },
  );
  if (error) return { error: "Não foi possível salvar a avaliação." };
  revalidatePath(`/app/aulas/${lessonId}`);
  return { ok: true };
}

