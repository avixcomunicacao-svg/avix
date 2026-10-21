import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * Destino dos links de e-mail do Supabase (convite, link mágico, recuperação).
 * Troca o código pela sessão e manda para `next` (convite → criar senha).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "invite" | "magiclink" | "recovery" | "email" | null;
  const next = searchParams.get("next") ?? (type === "invite" || type === "recovery" ? "/convite" : "/app");

  const supabase = await createSupabaseServer();
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/entrar?erro=link-invalido`);
}
