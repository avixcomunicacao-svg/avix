import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";

const { users, memberProfiles, memberTracks, tracks, lessonProgress, memberAvailability } = schema;

export type MemberListFilters = { q?: string; track?: string; status?: "ativo" | "pausado" | "expirado" | "todos" };

export async function touchLastSeen(userId: string) {
  try {
    await db.update(memberProfiles).set({ lastSeenAt: new Date() }).where(eq(memberProfiles.userId, userId));
  } catch {
    /* não bloqueia a renderização */
  }
}

export async function listMembers(filters: MemberListFilters = {}) {
  const where = [eq(users.role, "membro")];
  if (filters.q) where.push(or(ilike(users.name, `%${filters.q}%`), ilike(users.email, `%${filters.q}%`), ilike(memberProfiles.whatsappE164, `%${filters.q.replace(/\D/g, "")}%`))!);
  if (filters.status && filters.status !== "todos") where.push(eq(memberProfiles.status, filters.status));

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      whatsapp: memberProfiles.whatsappE164,
      status: memberProfiles.status,
      accessStart: memberProfiles.accessStart,
      accessEnd: memberProfiles.accessEnd,
      onboardingDone: memberProfiles.onboardingDone,
      inviteSentAt: memberProfiles.inviteSentAt,
      lastSeenAt: memberProfiles.lastSeenAt,
      isMadeClient: memberProfiles.isMadeClient,
      createdAt: memberProfiles.createdAt,
      lessonsDone: sql<number>`(select count(*) from ${lessonProgress} lp where lp.member_id = ${users.id} and lp.completed_at is not null)`.mapWith(Number),
    })
    .from(users)
    .innerJoin(memberProfiles, eq(memberProfiles.userId, users.id))
    .where(and(...where))
    .orderBy(desc(memberProfiles.createdAt));

  const ids = rows.map((r) => r.id);
  const trackRows = ids.length
    ? await db
        .select({ memberId: memberTracks.memberId, id: tracks.id, name: tracks.name, slug: tracks.slug })
        .from(memberTracks)
        .innerJoin(tracks, eq(tracks.id, memberTracks.trackId))
        .where(inArray(memberTracks.memberId, ids))
    : [];
  const byMember = new Map<string, { id: string; name: string; slug: string }[]>();
  for (const t of trackRows) byMember.set(t.memberId, [...(byMember.get(t.memberId) ?? []), { id: t.id, name: t.name, slug: t.slug }]);

  let result = rows.map((r) => ({ ...r, tracks: byMember.get(r.id) ?? [] }));
  if (filters.track) result = result.filter((r) => r.tracks.some((t) => t.id === filters.track || t.slug === filters.track));
  return result;
}

export async function getMember(id: string) {
  const row = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      profile: memberProfiles,
      availability: memberAvailability,
    })
    .from(users)
    .innerJoin(memberProfiles, eq(memberProfiles.userId, users.id))
    .leftJoin(memberAvailability, eq(memberAvailability.memberId, users.id))
    .where(and(eq(users.id, id), eq(users.role, "membro")))
    .limit(1);
  if (!row[0]) return null;
  const mt = await db
    .select({ id: tracks.id, name: tracks.name, slug: tracks.slug })
    .from(memberTracks)
    .innerJoin(tracks, eq(tracks.id, memberTracks.trackId))
    .where(eq(memberTracks.memberId, id))
    .orderBy(asc(tracks.order));
  return { ...row[0], tracks: mt };
}

export async function countMembers() {
  const [r] = await db.select({ n: count() }).from(memberProfiles).where(eq(memberProfiles.status, "ativo"));
  return r?.n ?? 0;
}

export async function listTracksBasic() {
  return db.select({ id: tracks.id, name: tracks.name, slug: tracks.slug }).from(tracks).orderBy(asc(tracks.order));
}
