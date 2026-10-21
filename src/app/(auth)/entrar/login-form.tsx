"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { signInWithPassword, signInWithMagicLink, type AuthState } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function LoginForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<"senha" | "link">("senha");
  const [pw, pwAction, pwPending] = useActionState<AuthState, FormData>(signInWithPassword, {});
  const [ml, mlAction, mlPending] = useActionState<AuthState, FormData>(signInWithMagicLink, {});

  if (mode === "link") {
    return (
      <form action={mlAction} className="flex flex-col gap-4">
        {ml.sent ? (
          <div className="rounded-[14px] bg-accent-soft p-4 t-body text-accent-text" role="status">
            Enviamos um link de acesso para o seu e-mail. Abra pelo celular ou computador e você entra direto.
          </div>
        ) : (
          <>
            <Field label="E-mail" htmlFor="email2" error={ml.error}>
              <Input id="email2" name="email" type="email" autoComplete="email" placeholder="Ex.: carla@exemplo.com" required aria-invalid={!!ml.error} />
            </Field>
            <Button type="submit" loading={mlPending} icon={<Mail className="size-4" />}>
              Receber link por e-mail
            </Button>
          </>
        )}
        <button type="button" onClick={() => setMode("senha")} className="t-body-sm text-brand-text underline-offset-2 hover:underline">
          Entrar com senha
        </button>
      </form>
    );
  }

  return (
    <form action={pwAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="Ex.: carla@exemplo.com" required />
      </Field>
      <Field label="Senha" htmlFor="password" error={pw.error}>
        <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="Sua senha" required aria-invalid={!!pw.error} />
      </Field>
      <Button type="submit" loading={pwPending}>
        Entrar
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-2 t-body-sm">
        <button type="button" onClick={() => setMode("link")} className="text-brand-text underline-offset-2 hover:underline">
          Entrar sem senha (link por e-mail)
        </button>
        <Link href="/recuperar" className="text-ink-muted underline-offset-2 hover:underline">
          Esqueci a senha
        </Link>
      </div>
    </form>
  );
}
