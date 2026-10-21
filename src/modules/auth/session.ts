import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createSupabaseServer } from "@/lib/supabase/server";
import { db, schema } from "@/db";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "membro";
  avatarUrl: string | null;
};

export type MemberAccess = {
  status: "ativo" | "pausado" | "expirado";
  accessStart: string;
  accessEnd: string;
  onboardingDone: boolean;
  isActive: boolean;
};

/** Usuário autenticado (ou null). Cacheado por request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const row = await db.query.users.findFirst({ where: eq(schema.users.id, user.id) });
  if (!row) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role, avatarUrl: row.avatarUrl };
});

export const getMemberAccess = cache(async (userId: string): Promise<MemberAccess | null> => {
  const p = await db.query.memberProfiles.findFirst({ where: eq(schema.memberProfiles.userId, userId) });
  if (!p) return null;
  const today = new Date().toISOString().slice(0, 10);
  const inWindow = p.accessStart <= today && today <= p.accessEnd;
  return {
    status: p.status,
    accessStart: p.accessStart,
    accessEnd: p.accessEnd,
    onboardingDone: p.onboardingDone,
    isActive: p.status === "ativo" && inWindow,
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/entrar");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/app");
  return user;
}

/** Membro autenticado. Redireciona admin para /admin; expirado/pausado para /app/renovar; sem onboarding para /app/boas-vindas. */
export async function requireMember(opts: { allowInactive?: boolean; allowNoOnboarding?: boolean } = {}) {
  const user = await requireUser();
  if (user.role === "admin") redirect("/admin");
  const access = await getMemberAccess(user.id);
  if (!access) redirect("/entrar?erro=sem-perfil");
  if (!access.isActive && !opts.allowInactive) redirect("/app/renovar");
  if (!access.onboardingDone && !opts.allowNoOnboarding && access.isActive) redirect("/app/boas-vindas");
  return { user, access };
}
