"use client";

import { useActionState } from "react";
import { setPassword, type AuthState } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

/** Destino do convite e da recuperação: o usuário já chega autenticado pelo link e cria a senha. */
export default function ConvitePage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(setPassword, {});
  return (
    <form action={action} className="flex flex-col gap-6">
      <div>
        <h1 className="t-h1">Crie sua senha</h1>
        <p className="mt-1 t-body text-ink-muted">É com ela que você vai entrar na Avix. Guarde num lugar seguro.</p>
      </div>
      <Field label="Nova senha" htmlFor="password" help="Pelo menos 8 caracteres.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Field label="Repita a senha" htmlFor="confirm" error={state.error}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required aria-invalid={!!state.error} />
      </Field>
      <Button type="submit" loading={pending}>
        Salvar e entrar
      </Button>
    </form>
  );
}
