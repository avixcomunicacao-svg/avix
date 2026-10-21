"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type AuthState } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export default function RecuperarPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  return (
    <form action={action} className="flex flex-col gap-6">
      <div>
        <h1 className="t-h1">Recuperar senha</h1>
        <p className="mt-1 t-body text-ink-muted">Enviamos um link para você criar uma senha nova.</p>
      </div>
      {state.sent ? (
        <p className="rounded-[14px] bg-accent-soft p-4 t-body text-accent-text" role="status">
          Se esse e-mail estiver cadastrado, o link chega em instantes.
        </p>
      ) : (
        <>
          <Field label="E-mail" htmlFor="email" error={state.error}>
            <Input id="email" name="email" type="email" placeholder="Ex.: carla@exemplo.com" required />
          </Field>
          <Button type="submit" loading={pending}>
            Enviar link
          </Button>
        </>
      )}
      <Link href="/entrar" className="t-body-sm text-brand-text">
        ← Voltar para entrar
      </Link>
    </form>
  );
}
