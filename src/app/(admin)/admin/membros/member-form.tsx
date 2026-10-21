"use client";

import { useActionState } from "react";
import { createMember, updateMember, type ActionState } from "@/modules/members/actions";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/primitives";
import { fmtPhone } from "@/lib/format";

type Track = { id: string; name: string };
type Initial = {
  name: string;
  email: string;
  whatsapp: string;
  accessStart: string;
  accessEnd: string;
  goals: string | null;
  notesPrivate: string | null;
  isMadeClient: boolean;
  trackIds: string[];
};

export function MemberForm({ tracks, initial, memberId }: { tracks: Track[]; initial?: Initial; memberId?: string }) {
  const action = memberId ? updateMember.bind(null, memberId) : createMember;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const fe = state.fieldErrors ?? {};
  const today = new Date().toISOString().slice(0, 10);
  const in6m = new Date(Date.now() + 182 * 864e5).toISOString().slice(0, 10);

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Card className="flex flex-col gap-4">
          <h2 className="t-h3">Dados do aluno</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome completo" htmlFor="name" error={fe.name} className="md:col-span-2">
              <Input id="name" name="name" defaultValue={initial?.name} placeholder="Ex.: Carla Mendes" required aria-invalid={!!fe.name} />
            </Field>
            <Field label="E-mail" htmlFor="email" error={fe.email} help="É o login do aluno e para onde vai o convite.">
              <Input id="email" name="email" type="email" defaultValue={initial?.email} placeholder="Ex.: carla@exemplo.com" required aria-invalid={!!fe.email} />
            </Field>
            <Field label="WhatsApp" htmlFor="whatsapp" error={fe.whatsapp} help="Com DDD. É a chave que liga as conversas a este aluno.">
              <Input id="whatsapp" name="whatsapp" inputMode="tel" defaultValue={initial ? fmtPhone(initial.whatsapp) : ""} placeholder="Ex.: (27) 99999-0000" required mono aria-invalid={!!fe.whatsapp} />
            </Field>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="t-h3">Acesso</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Início" htmlFor="accessStart" error={fe.accessStart}>
              <Input id="accessStart" name="accessStart" type="date" defaultValue={initial?.accessStart ?? today} required />
            </Field>
            <Field label="Término" htmlFor="accessEnd" error={fe.accessEnd} help="Depois disso o aluno vê a tela de renovação.">
              <Input id="accessEnd" name="accessEnd" type="date" defaultValue={initial?.accessEnd ?? in6m} required aria-invalid={!!fe.accessEnd} />
            </Field>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="t-label text-ink-muted">Trilhas</legend>
            {tracks.length === 0 ? (
              <p className="t-body-sm text-ink-faint">Nenhuma trilha criada ainda. Você pode vincular depois em Conteúdos.</p>
            ) : (
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {tracks.map((t) => (
                  <Checkbox key={t.id} name="tracks" value={t.id} defaultChecked={initial?.trackIds.includes(t.id)} label={t.name} />
                ))}
              </div>
            )}
            <p className="t-body-sm text-ink-faint">O aluno só vê aulas e mentorias em grupo das trilhas marcadas.</p>
          </fieldset>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="t-h3">Objetivos</h2>
          <Field label="O que o aluno quer alcançar" htmlFor="goals" help="O aluno pode editar no primeiro acesso.">
            <Textarea id="goals" name="goals" defaultValue={initial?.goals ?? ""} placeholder="Ex.: dobrar os agendamentos até março." />
          </Field>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4 bg-surface-100">
          <h2 className="t-h3">Notas privadas</h2>
          <Field label="Só você vê" htmlFor="notesPrivate">
            <Textarea id="notesPrivate" name="notesPrivate" defaultValue={initial?.notesPrivate ?? ""} placeholder="Observações, contexto, histórico…" className="bg-surface-200" />
          </Field>
          <Checkbox name="isMadeClient" defaultChecked={initial?.isMadeClient} label={<span className="t-body-sm">Também é cliente da Made (prepara a integração com Notion e CRM)</span>} />
        </Card>

        {!memberId && (
          <Card className="flex flex-col gap-3">
            <Checkbox name="sendInvite" defaultChecked label="Enviar convite por e-mail agora" />
            <p className="t-body-sm text-ink-faint">O aluno recebe um link para criar a senha. Você pode reenviar depois.</p>
          </Card>
        )}

        {state.error && <p className="rounded-[10px] bg-danger-soft px-4 py-3 t-body-sm text-danger" role="alert">{state.error}</p>}
        {state.ok && <p className="rounded-[10px] bg-accent-soft px-4 py-3 t-body-sm text-accent-text" role="status">{state.message}</p>}

        <Button type="submit" loading={pending} className="w-full">
          {memberId ? "Salvar alterações" : "Cadastrar membro"}
        </Button>
      </div>
    </form>
  );
}
