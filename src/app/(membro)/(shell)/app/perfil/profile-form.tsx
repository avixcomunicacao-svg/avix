"use client";

import { useActionState } from "react";
import { updateMyProfile, type ActionState } from "@/modules/members/actions";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/primitives";
import { WeekdayPicker } from "@/components/ui/weekday-picker";

type Initial = { name: string; goals: string; weekdays: number[]; hoursPerWeek: number; agendaTime: string; agendaWhatsapp: boolean; agendaEmail: boolean };

export function ProfileForm({ initial }: { initial: Initial }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateMyProfile, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <h2 className="t-h3">Dados e objetivo</h2>
        <Field label="Nome" htmlFor="name" error={fe.name}>
          <Input id="name" name="name" defaultValue={initial.name} required />
        </Field>
        <Field label="O que você quer alcançar" htmlFor="goals">
          <Textarea id="goals" name="goals" defaultValue={initial.goals} />
        </Field>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="t-h3">Disponibilidade para o plano</h2>
        <Field label="Dias em que você executa as ações" error={fe.weekdays}>
          <WeekdayPicker defaultValue={initial.weekdays} />
        </Field>
        <Field label="Horas por semana" htmlFor="hoursPerWeek" help="O plano nunca ultrapassa isso.">
          <Input id="hoursPerWeek" name="hoursPerWeek" type="number" min={1} max={40} defaultValue={initial.hoursPerWeek} className="max-w-32" />
        </Field>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="t-h3">Agenda do dia</h2>
        <Field label="Horário" htmlFor="agendaTime" help="Você recebe a agenda só nos dias em que tiver ações." error={fe.agendaTime}>
          <Input id="agendaTime" name="agendaTime" type="time" defaultValue={initial.agendaTime} className="max-w-32" />
        </Field>
        <div className="flex flex-col gap-2">
          <Checkbox name="agendaWhatsapp" defaultChecked={initial.agendaWhatsapp} label="Receber no WhatsApp" />
          <Checkbox name="agendaEmail" defaultChecked={initial.agendaEmail} label="Receber por e-mail" />
        </div>
      </Card>

      {state.ok && <p className="rounded-[10px] bg-accent-soft px-4 py-3 t-body-sm text-accent-text" role="status">{state.message}</p>}
      {state.error && <p className="rounded-[10px] bg-danger-soft px-4 py-3 t-body-sm text-danger" role="alert">{state.error}</p>}

      <Button type="submit" loading={pending} className="md:self-start">
        Salvar perfil
      </Button>
    </form>
  );
}
