"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { createTrack, updateTrack, createModule, updateModule, type ActionState } from "@/modules/content/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";

function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} className="m-auto w-[min(92vw,480px)] rounded-[20px] border border-border bg-surface-200 p-0 text-ink shadow-lg backdrop:bg-overlay">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="t-h3">{title}</h2>
        <button onClick={onClose} aria-label="Fechar" className="grid size-9 place-items-center rounded-[8px] text-ink-muted hover:bg-surface-100">
          <X className="size-5" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}

export function NewTrackForm({ primary }: { primary?: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(createTrack, {});
  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);
  return (
    <>
      <Button variant={primary ? "primary" : "secondary"} icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>
        Nova trilha
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Nova trilha">
        <form action={action} className="flex flex-col gap-4">
          <Field label="Nome" htmlFor="track-name" error={state.fieldErrors?.name}>
            <Input id="track-name" name="name" placeholder="Ex.: Marketing" required autoFocus />
          </Field>
          <Field label="Descrição (opcional)" htmlFor="track-desc">
            <Textarea id="track-desc" name="description" placeholder="O que o aluno vai aprender nesta trilha." />
          </Field>
          <Button type="submit" loading={pending}>
            Criar trilha
          </Button>
        </form>
      </Dialog>
    </>
  );
}

export function EditTrackForm({ id, name, description, open, onClose }: { id: string; name: string; description: string | null; open: boolean; onClose: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateTrack.bind(null, id), {});
  useEffect(() => {
    if (state.ok) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <Dialog open={open} onClose={onClose} title="Editar trilha">
      <form action={action} className="flex flex-col gap-4">
        <Field label="Nome" htmlFor={`t-${id}-name`} error={state.fieldErrors?.name}>
          <Input id={`t-${id}-name`} name="name" defaultValue={name} required />
        </Field>
        <Field label="Descrição" htmlFor={`t-${id}-desc`}>
          <Textarea id={`t-${id}-desc`} name="description" defaultValue={description ?? ""} />
        </Field>
        <Button type="submit" loading={pending}>
          Salvar
        </Button>
      </form>
    </Dialog>
  );
}

export function NewModuleForm({ trackId, open, onClose }: { trackId: string; open: boolean; onClose: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createModule, {});
  useEffect(() => {
    if (state.ok) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <Dialog open={open} onClose={onClose} title="Novo módulo">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="trackId" value={trackId} />
        <Field label="Título" htmlFor={`m-${trackId}-title`} error={state.fieldErrors?.title}>
          <Input id={`m-${trackId}-title`} name="title" placeholder="Ex.: Módulo 1 · Fundamentos" required autoFocus />
        </Field>
        <Field label="Descrição (opcional)" htmlFor={`m-${trackId}-desc`}>
          <Textarea id={`m-${trackId}-desc`} name="description" />
        </Field>
        <Button type="submit" loading={pending}>
          Criar módulo
        </Button>
      </form>
    </Dialog>
  );
}

export function EditModuleForm({ id, title, description, open, onClose }: { id: string; title: string; description: string | null; open: boolean; onClose: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateModule.bind(null, id), {});
  useEffect(() => {
    if (state.ok) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <Dialog open={open} onClose={onClose} title="Editar módulo">
      <form action={action} className="flex flex-col gap-4">
        <Field label="Título" htmlFor={`em-${id}-title`} error={state.fieldErrors?.title}>
          <Input id={`em-${id}-title`} name="title" defaultValue={title} required />
        </Field>
        <Field label="Descrição" htmlFor={`em-${id}-desc`}>
          <Textarea id={`em-${id}-desc`} name="description" defaultValue={description ?? ""} />
        </Field>
        <Button type="submit" loading={pending}>
          Salvar
        </Button>
      </form>
    </Dialog>
  );
}
