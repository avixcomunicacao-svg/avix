import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function EntrarPage(props: { searchParams: Promise<{ next?: string; erro?: string }> }) {
  const { next, erro } = await props.searchParams;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="t-h1">Entrar</h1>
        <p className="mt-1 t-body text-ink-muted">Use o e-mail que o mentor cadastrou.</p>
      </div>
      {erro === "sem-perfil" && (
        <p className="rounded-[10px] bg-warning-soft px-4 py-3 t-body-sm text-warning" role="alert">
          Sua conta existe, mas ainda não tem perfil de aluno. Fale com o mentor.
        </p>
      )}
      <LoginForm next={next} />
    </div>
  );
}
