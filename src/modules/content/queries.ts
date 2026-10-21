import "server-only";
import { and, asc, count, eq, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { createSupabaseServer } from "@/lib/supabase/server";

const { tracks, modules, lessons, lessonMaterials, lessonProgress, memberTracks } = schema;

/* ---------------------------------------------------------------------------
 * Admin (conexão direta)
 * ------------------------------------------------------------------------- */
export async function getContentStats() {
  const [[t], [pub], [draft], [done]] = await Promise.all([
    db.select({ n: count() }).from(tracks),
    db.select({ n: count() }).from(lessons).where(eq(lessons.status, "publicada")),
    db.select({ n: count() }).from(lessons).where(eq(lessons.status, "rascunho")),
    db.select({ n: count() }).from(lessonProgress).where(isNotNull(lessonProgress.completedAt)),
  ]);
  return { tracks: t?.n ?? 0, lessonsPublished: pub?.n ?? 0, lessonsDraft: draft?.n ?? 0, completions: done?.n ?? 0 };
}

export async function listTracksTree() {
  const rows = await db.query.tracks.findMany({
    orderBy: [asc(tracks.order), asc(tracks.createdAt)],
    with: {
      modules: {
        orderBy: [asc(modules.order), asc(modules.createdAt)],
        with: { lessons: { orderBy: [asc(lessons.order), asc(lessons.createdAt)], columns: { id: true, title: true, status: true, durationSec: true, videoStatus: true, order: true, releaseAt: true, releaseAfterDays: true } } },
      },
      members: { columns: { memberId: true } },
    },
  });
  return rows;
}

export async function getTrack(id: string) {
  return db.query.tracks.findFirst({ where: eq(tracks.id, id) });
}

export async function getLessonAdmin(id: string) {
  return db.query.lessons.findFirst({
    where: eq(lessons.id, id),
    with: { module: { with: { track: true } }, materials: { orderBy: [asc(lessonMaterials.order)] } },
  });
}

export async function listModulesForSelect() {
  return db
    .select({ id: modules.id, title: modules.title, trackName: tracks.name, trackId: tracks.id })
    .from(modules)
    .innerJoin(tracks, eq(tracks.id, modules.trackId))
    .orderBy(asc(tracks.order), asc(modules.order));
}

export async function getMemberProgress(memberId: string) {
  const mts = await db
    .select({ trackId: tracks.id, name: tracks.name })
    .from(memberTracks)
    .innerJoin(tracks, eq(tracks.id, memberTracks.trackId))
    .where(eq(memberTracks.memberId, memberId))
    .orderBy(asc(tracks.order));
  if (!mts.length) return { byTrack: [] as { trackId: string; name: string; total: number; done: number }[] };
  const byTrack = await Promise.all(
    mts.map(async (t) => {
      const [[total], [done]] = await Promise.all([
        db.select({ n: count() }).from(lessons).innerJoin(modules, eq(modules.id, lessons.moduleId)).where(and(eq(modules.trackId, t.trackId), eq(lessons.status, "publicada"))),
        db
          .select({ n: count() })
          .from(lessonProgress)
          .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
          .innerJoin(modules, eq(modules.id, lessons.moduleId))
          .where(and(eq(modules.trackId, t.trackId), eq(lessonProgress.memberId, memberId), isNotNull(lessonProgress.completedAt))),
      ]);
      return { ...t, total: total?.n ?? 0, done: done?.n ?? 0 };
    }),
  );
  return { byTrack };
}

/* ---------------------------------------------------------------------------
 * Membro (sessão Supabase → RLS decide o que ele vê)
 * ------------------------------------------------------------------------- */
export type MemberLesson = {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  duration_sec: number | null;
  order: number;
  video_status: string;
};

export async function memberTracksWithProgress(memberId: string) {
  const supabase = await createSupabaseServer();
  const [{ data: ts }, { data: ms }, { data: ls }, { data: prog }] = await Promise.all([
    supabase.from("tracks").select("id,name,slug,description,order").order("order"),
    supabase.from("modules").select("id,track_id,title,description,order").order("order"),
    supabase.from("lessons").select("id,module_id,title,description,duration_sec,order,video_status").order("order"),
    supabase.from("lesson_progress").select("lesson_id,position_sec,completed_at,last_watched_at").eq("member_id", memberId),
  ]);
  const progress = new Map((prog ?? []).map((p) => [p.lesson_id as string, p]));
  const lessonsByModule = new Map<string, MemberLesson[]>();
  for (const l of (ls ?? []) as MemberLesson[]) lessonsByModule.set(l.module_id, [...(lessonsByModule.get(l.module_id) ?? []), l]);

  const trackList = (ts ?? []).map((t) => {
    const mods = (ms ?? [])
      .filter((m) => m.track_id === t.id)
      .map((m) => ({ ...m, lessons: lessonsByModule.get(m.id as string) ?? [] }));
    const all = mods.flatMap((m) => m.lessons);
    const done = all.filter((l) => progress.get(l.id)?.completed_at).length;
    return { ...t, modules: mods, total: all.length, done, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
  });

  // "Continuar assistindo": última aula não concluída com posição > 0
  const lastWatched = (prog ?? [])
    .filter((p) => !p.completed_at && (p.position_sec as number) > 0)
    .sort((a, b) => String(b.last_watched_at).localeCompare(String(a.last_watched_at)))[0];
  let continueLesson: (MemberLesson & { trackName: string; moduleTitle: string; positionSec: number }) | null = null;
  if (lastWatched) {
    for (const t of trackList)
      for (const m of t.modules)
        for (const l of m.lessons)
          if (l.id === lastWatched.lesson_id) continueLesson = { ...l, trackName: t.name as string, moduleTitle: m.title as string, positionSec: lastWatched.position_sec as number };
  }

  return { tracks: trackList, progress, continueLesson };
}

export async function memberLesson(memberId: string, lessonId: string) {
  const supabase = await createSupabaseServer();
  const { data: l } = await supabase.from("lessons").select("id,module_id,title,description,video_id,video_status,duration_sec,order").eq("id", lessonId).maybeSingle();
  if (!l) return null;
  const [{ data: m }, { data: mats }, { data: p }, { data: siblings }] = await Promise.all([
    supabase.from("modules").select("id,title,track_id").eq("id", l.module_id).maybeSingle(),
    supabase.from("lesson_materials").select("id,type,url,label,size_bytes").eq("lesson_id", lessonId).order("order"),
    supabase.from("lesson_progress").select("position_sec,completed_at").eq("member_id", memberId).eq("lesson_id", lessonId).maybeSingle(),
    supabase.from("lessons").select("id,title,order").eq("module_id", l.module_id).order("order"),
  ]);
  const { data: t } = m ? await supabase.from("tracks").select("id,name,slug").eq("id", m.track_id).maybeSingle() : { data: null };
  const { data: rating } = await supabase.from("ratings").select("score,comment").eq("member_id", memberId).eq("target_type", "lesson").eq("target_id", lessonId).maybeSingle();
  const idx = (siblings ?? []).findIndex((s) => s.id === lessonId);
  return {
    lesson: l,
    module: m,
    track: t,
    materials: mats ?? [],
    progress: p,
    rating,
    position: { index: idx + 1, total: siblings?.length ?? 0 },
    next: siblings?.[idx + 1] ?? null,
    prev: siblings?.[idx - 1] ?? null,
  };
}

export async function memberAnnouncements() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from("announcements").select("id,title,body,published_at").order("published_at", { ascending: false }).limit(3);
  return data ?? [];
}

