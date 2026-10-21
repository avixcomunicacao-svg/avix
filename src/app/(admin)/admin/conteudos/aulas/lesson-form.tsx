"use client";

import { useActionState, useState } from "react";
import { FileText, Link2, Plus, Trash2 } from "lucide-react";
import { createLesson, updateLesson, deleteLesson, type ActionState } from "@/modules/content/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/primitives";
import { VideoUploader } from "./video-uploader";

type ModuleOpt = { id: string; title: string; trackName: string };
type Material = { id?: string; type: "file" | "link"; label: string; url: string };
type Initial = {
  moduleId: string;
  title: string;
  description: string | null;
  status: "rascunho" | "publicada";
  releaseAt: string | null;
  releaseAfterDays: number | null;
  materials: Material[];
  videoId: string | null;
  videoStatus: "aguardando" | "processando" | "pronto" | "erro";
  durationSec: number | null;
};

export function LessonForm({ modules, initial, lessonId, defaultModuleId, bunnyConfigured }: { modules: ModuleOpt[]; initial?: Initial; lessonId?: string; defaultModuleId?: string; bunnyConfigured: boolean }) {
  const action = lessonId ? updateLesson.bind(null, lessonId) : createLesson;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const fe = state.fieldErrors ?? {};
  const [releaseMode, setReleaseMode] = useState<"imediata" | "data" | "dias">(initial?.releaseAt ? "data" : initial?.releaseAfterDays != null ? "dias" : "imediata");
  const [materials, setMaterials] = useState<Material[]>(initial?.materials ?? []);

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-3">
      <input type="hidden" name="materials" value={JSON.stringify(materials)} />
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Card className="flex flex-col gap-4">
          <h2 className="t-h3">Aula</h2>
          <Field label="Módulo" htmlFor="moduleId" error={fe.moduleId}>
            <Select id="moduleId" name="moduleId" defaultValue={initial?.moduleId ?? defaultModuleId ?? ""} required>
              <option value="" disabled>
                Escolha o módulo
              </option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.trackName} · {m.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Título" htmlFor="title" error={fe.title}>
            <Input id="title" name="title" defaultValue={initial?.title} placeholder="Ex.: Oferta irresistível" required aria-invalid={!!fe.title} />
          </Field>
          <Field label="Descrição" htmlFor="description" help="O que o aluno vai aprender e o que deve fazer depois. Em segunda pessoa.">
            <Textarea id="description" name="description" defaultValue={initial?.description ?? ""} placeholder="Ex.: Como transformar o que você vende numa oferta que o cliente entende em 10 segundos." />
          </Field>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="t-h3">Vídeo</h2>
          {lessonId ? (
            <VideoUploader lessonId={lessonId} videoId={initial?.videoId ?? null} videoStatus={initial?.videoStatus ?? "aguardando"} durationSec={initial?.durationSec ?? null} configured={bunnyConfigured} />
          ) : (
            <p className="rounded-[10px] bg-surface-100 px-4 py-3 t-body-sm text-ink-muted">Salve a aula primeiro; o envio do vídeo aparece em seguida.</p>
          )}
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="t-h3">Materiais</h2>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" icon={<Link2 className="size-4" />} onClick={() => setMaterials((m) => [...m, { type: "link", label: "", url: "" }])}>
                Link
              </Button>
              <Button type="button" variant="ghost" size="sm" icon={<FileText className="size-4" />} onClick={() => setMaterials((m) => [...m, { type: "file", label: "", url: "" }])}>
                Arquivo (URL)
              </Button>
            </div>
          </div>
          {materials.length === 0 ? (
            <p className="t-body-sm text-ink-faint">Sem materiais. Adicione PDFs, planilhas ou links que complementam a aula.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {materials.map((m, i) => (
                <div key={i} className="grid gap-2 rounded-[10px] border border-border p-3 md:grid-cols-[1fr_1.4fr_auto]">
                  <Input value={m.label} placeholder={m.type === "link" ? "Nome do link" : "Nome do arquivo"} onChange={(e) => setMaterials((arr) => arr.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} aria-label="Nome" />
                  <Input value={m.url} placeholder="https://…" inputMode="url" onChange={(e) => setMaterials((arr) => arr.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} aria-label="URL" />
                  <button type="button" aria-label="Remover material" onClick={() => setMaterials((arr) => arr.filter((_, j) => j !== i))} className="grid size-11 place-items-center rounded-[10px] text-ink-muted hover:bg-danger-soft hover:text-danger">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {fe.materials && <p className="t-body-sm text-danger">{fe.materials}</p>}
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <h2 className="t-h3">Publicação</h2>
          <Field label="Status" htmlFor="status">
            <Select id="status" name="status" defaultValue={initial?.status ?? "rascunho"}>
              <option value="rascunho">Rascunho (só você vê)</option>
              <option value="publicada">Publicada</option>
            </Select>
          </Field>
          <Field label="Liberação" htmlFor="releaseMode">
            <Select id="releaseMode" name="releaseMode" value={releaseMode} onChange={(e) => setReleaseMode(e.target.value as typeof releaseMode)}>
              <option value="imediata">Imediata ao publicar</option>
              <option value="data">Em uma data</option>
              <option value="dias">Dias após a entrada do aluno</option>
            </Select>
          </Field>
          {releaseMode === "data" && (
            <Field label="Data e hora" htmlFor="releaseAt">
              <Input id="releaseAt" name="releaseAt" type="datetime-local" defaultValue={initial?.releaseAt ? initial.releaseAt.slice(0, 16) : ""} required />
            </Field>
          )}
          {releaseMode === "dias" && (
            <Field label="Dias após o início do acesso" htmlFor="releaseAfterDays" help="0 = no primeiro dia.">
              <Input id="releaseAfterDays" name="releaseAfterDays" type="number" min={0} defaultValue={initial?.releaseAfterDays ?? 0} required />
            </Field>
          )}
        </Card>

        {state.error && <p className="rounded-[10px] bg-danger-soft px-4 py-3 t-body-sm text-danger" role="alert">{state.error}</p>}
        {state.ok && <p className="rounded-[10px] bg-accent-soft px-4 py-3 t-body-sm text-accent-text" role="status">{state.message}</p>}

        <Button type="submit" loading={pending} className="w-full" icon={!lessonId ? <Plus className="size-4" strokeWidth={2.2} /> : undefined}>
          {lessonId ? "Salvar aula" : "Criar aula"}
        </Button>
        {lessonId && (
          <Button
            type="button"
            variant="danger"
            className="w-full"
            icon={<Trash2 className="size-4" />}
            onClick={() => {
              if (confirm("Excluir esta aula? O vídeo e o progresso dos alunos nela também serão removidos.")) deleteLesson(lessonId);
            }}
          >
            Excluir aula
          </Button>
        )}
      </div>
    </form>
  );
}
