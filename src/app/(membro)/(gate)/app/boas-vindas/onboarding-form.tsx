"use client";

import { useActionState } from "react";
import { completeOnboarding, type ActionState } from "@/modules/members/actions";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { WeekdayPicker } from "@/components/ui/weekday-picker";

export function OnboardingForm({ brand }: { brand: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(completeOnboarding, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-6">
      <Field label="O que você quer alcançar com a mentoria?" htmlFor="goals" error={fe.goals} help="Em uma ou duas frases. O mentor lê isso antes de cada encontro.">
        <Textarea id="goals" name="goals" placeholder="Ex.: dobrar os agendamentos da clínica até março com tráfego pago e uma oferta clara." required aria-invalid={!!fe.goals} />
      </Field>

      <Field label="Em quais dias você consegue executar o plano?" error={fe.weekdays} help="Suas ações só serão agendadas nesses dias.">
        <WeekdayPicker />
      </Field>

      <Field label="Quantas horas por semana?" htmlFor="hoursPerWeek" error={fe.hoursPerWeek} help="Seja realista: o plano nunca vai ultrapassar isso.">
        <Input id="hoursPerWeek" name="hoursPerWeek" type="number" min={1} max={40} defaultValue={4} inputMode="numeric" className="max-w-32" />
      </Field>

      <div className="rounded-[14px] border border-border bg-surface-200 p-4">
        <Checkbox
          name="consent"
          required
          label={
            <span className="t-body-sm text-ink-muted">
              Autorizo que as mentorias ao vivo sejam gravadas e transcritas, e que minhas conversas com o mentor no WhatsApp sejam usadas para gerar atas e meu plano de ação dentro da {brand}. Esses dados são só meus e do mentor, e posso pedir a exclusão a qualquer momento. (LGPD)
            </span>
          }
        />
        {fe.consent && <p className="mt-2 t-body-sm text-danger">{fe.consent}</p>}
      </div>

      {state.error && <p className="t-body-sm text-danger" role="alert">{state.error}</p>}

      <Button type="submit" loading={pending} className="w-full">
        Começar
      </Button>
    </form>
  );
}
