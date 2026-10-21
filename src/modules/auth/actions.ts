"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export type AuthState = { error?: string; sent?: boolean };

const credentials = z.object({
  email: z.string().email("Digite um e-mail completo, como nome@exemplo.com."),
  password: z.string().min(1, "Digite sua senha."),
});

export async function signInWithPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "E-mail ou senha não conferem. Confira e tente de novo, ou entre com o link por e-mail." };
  const next = String(formData.get("next") || "");
  redirect(next.startsWith("/") ? next : "/app");
}

export async function signInWithMagicLink(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Digite um e-mail completo, como nome@exemplo.com." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { shouldCreateUser: false, emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
  });
  if (error) return { error: "Não encontramos esse e-mail. Se você é aluno, peça o convite ao mentor." };
  return { sent: true };
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Digite um e-mail completo, como nome@exemplo.com." };
  const supabase = await createSupabaseServer();
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/convite` });
  return { sent: true };
}

const newPassword = z
  .object({
    password: z.string().min(8, "Use pelo menos 8 caracteres."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "As senhas não são iguais.", path: ["confirm"] });

export async function setPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = newPassword.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Não foi possível salvar a senha. O link pode ter expirado — peça um novo ao mentor." };
  redirect("/app");
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/entrar");
}
