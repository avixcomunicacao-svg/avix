"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical, Pencil, Plus, Trash2, Users, Video } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import { Badge, Card } from "@/components/ui/primitives";
import { reorder, deleteTrack, deleteModule } from "@/modules/content/actions";
import { fmtDuration, fmtDate } from "@/lib/format";
import { EditTrackForm, NewModuleForm, EditModuleForm } from "./forms";

type Lesson = { id: string; title: string; status: "rascunho" | "publicada"; durationSec: number | null; videoStatus: string; releaseAt: string | null; releaseAfterDays: number | null };
type Module = { id: string; title: string; description: string | null; lessons: Lesson[] };
type Track = { id: string; name: string; slug: string; description: string | null; memberCount: number; modules: Module[] };

function Handle({ listeners, attributes }: { listeners?: Record<string, unknown>; attributes?: Record<string, unknown> }) {
  return (
    <button className="grid size-8 shrink-0 cursor-grab place-items-center rounded-[6px] text-ink-faint hover:bg-surface-300 active:cursor-grabbing" aria-label="Arrastar para reordenar" {...listeners} {...attributes}>
      <GripVertical className="size-4" />
    </button>
  );
}

function SortableRow({ id, children, className }: { id: string; children: (h: { listeners?: Record<string, unknown>; attributes?: Record<string, unknown> }) => React.ReactNode; className?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn(isDragging && "z-10 opacity-80 shadow-md", className)}>
      {children({ listeners: listeners as Record<string, unknown>, attributes: attributes as unknown as Record<string, unknown> })}
    </div>
  );
}

function useDnd<T extends { id: string }>(initial: T[], kind: "tracks" | "modules" | "lessons") {
  const [items, setItems] = useState(initial);
  const [, start] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, from, to);
    setItems(next);
    start(() => reorder(kind, next.map((i) => i.id)));
  };
  return { items, setItems, sensors, onDragEnd };
}

export function ContentTree({ tracks }: { tracks: Track[] }) {
  const { items, sensors, onDragEnd } = useDnd(tracks, "tracks");
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-4">
          {items.map((t) => (
            <SortableRow key={t.id} id={t.id}>
              {(h) => <TrackCard track={t} handle={h} />}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function TrackCard({ track, handle }: { track: Track; handle: { listeners?: Record<string, unknown>; attributes?: Record<string, unknown> } }) {
  const [open, setOpen] = useState(true);
  const [edit, setEdit] = useState(false);
  const [newMod, setNewMod] = useState(false);
  const [pending, start] = useTransition();
  const { items, sensors, onDragEnd } = useDnd(track.modules, "modules");
  const lessonCount = track.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <Card className="p-0 md:p-0">
      <div className="flex items-center gap-2 p-3 md:p-4">
        <Handle {...handle} />
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="grid size-8 place-items-center rounded-[6px] text-ink-muted hover:bg-surface-100">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
        <div className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-gradient-brand text-on-brand">
          <span className="absolute -right-2 -top-2 size-5 rounded-[6px] bg-gradient-accent" />
          <span className="relative font-display text-sm font-bold">{track.name.slice(0, 2).toUpperCase()}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="t-h3 truncate">{track.name}</span>
          <span className="t-caption text-ink-faint">
            {track.modules.length} módulo{track.modules.length === 1 ? "" : "s"} · {lessonCount} aula{lessonCount === 1 ? "" : "s"} · <Users className="inline size-3" /> {track.memberCount} membro{track.memberCount === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setNewMod(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-[8px] px-3 t-label text-brand-text hover:bg-brand-soft">
            <Plus className="size-4" /> Módulo
          </button>
          <button onClick={() => setEdit(true)} aria-label="Editar trilha" className="grid size-9 place-items-center rounded-[8px] text-ink-muted hover:bg-surface-100">
            <Pencil className="size-4" />
          </button>
          <button
            aria-label="Excluir trilha"
            disabled={pending || track.modules.length > 0}
            title={track.modules.length > 0 ? "Remova os módulos antes" : "Excluir trilha"}
            onClick={() => {
              if (confirm(`Excluir a trilha "${track.name}"?`)) start(() => deleteTrack(track.id));
            }}
            className="grid size-9 place-items-center rounded-[8px] text-ink-muted hover:bg-danger-soft hover:text-danger disabled:opacity-40"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-surface-100/60 p-3 md:p-4">
          {items.length === 0 ? (
            <p className="px-2 py-3 t-body-sm text-ink-faint">Sem módulos. Crie o primeiro para começar a adicionar aulas.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={items.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {items.map((m) => (
                    <SortableRow key={m.id} id={m.id}>
                      {(h) => <ModuleRow module={m} handle={h} />}
                    </SortableRow>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
      <EditTrackForm id={track.id} name={track.name} description={track.description} open={edit} onClose={() => setEdit(false)} />
      <NewModuleForm trackId={track.id} open={newMod} onClose={() => setNewMod(false)} />
    </Card>
  );
}

function ModuleRow({ module, handle }: { module: Module; handle: { listeners?: Record<string, unknown>; attributes?: Record<string, unknown> } }) {
  const [open, setOpen] = useState(true);
  const [edit, setEdit] = useState(false);
  const [pending, start] = useTransition();
  const { items, sensors, onDragEnd } = useDnd(module.lessons, "lessons");

  return (
    <div className="rounded-[10px] border border-border bg-surface-200">
      <div className="flex items-center gap-2 px-2 py-2">
        <Handle {...handle} />
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="grid size-8 place-items-center rounded-[6px] text-ink-muted hover:bg-surface-100">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
        <span className="min-w-0 flex-1 truncate t-body font-semibold">{module.title}</span>
        <span className="t-caption text-ink-faint">{module.lessons.length} aula{module.lessons.length === 1 ? "" : "s"}</span>
        <Link href={`/admin/conteudos/nova-aula?modulo=${module.id}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-[8px] px-3 t-label text-brand-text hover:bg-brand-soft">
          <Plus className="size-4" /> Aula
        </Link>
        <button onClick={() => setEdit(true)} aria-label="Editar módulo" className="grid size-9 place-items-center rounded-[8px] text-ink-muted hover:bg-surface-100">
          <Pencil className="size-4" />
        </button>
        <button
          aria-label="Excluir módulo"
          disabled={pending || module.lessons.length > 0}
          title={module.lessons.length > 0 ? "Remova as aulas antes" : "Excluir módulo"}
          onClick={() => {
            if (confirm(`Excluir o módulo "${module.title}"?`)) start(() => deleteModule(module.id));
          }}
          className="grid size-9 place-items-center rounded-[8px] text-ink-muted hover:bg-danger-soft hover:text-danger disabled:opacity-40"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      {open && items.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col border-t border-border">
              {items.map((l) => (
                <SortableRow key={l.id} id={l.id}>
                  {(h) => <LessonRow lesson={l} handle={h} />}
                </SortableRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      <EditModuleForm id={module.id} title={module.title} description={module.description} open={edit} onClose={() => setEdit(false)} />
    </div>
  );
}

function LessonRow({ lesson, handle }: { lesson: Lesson; handle: { listeners?: Record<string, unknown>; attributes?: Record<string, unknown> } }) {
  const release = lesson.releaseAt ? `libera ${fmtDate(lesson.releaseAt)}` : lesson.releaseAfterDays != null ? `libera ${lesson.releaseAfterDays} dias após a entrada` : null;
  return (
    <div className="flex items-center gap-2 border-b border-border px-2 py-2 last:border-b-0 hover:bg-surface-100">
      <Handle {...handle} />
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-[6px]", lesson.videoStatus === "pronto" ? "bg-accent-soft text-accent-text" : "bg-surface-300 text-ink-faint")}>
        <Video className="size-4" />
      </span>
      <Link href={`/admin/conteudos/aulas/${lesson.id}`} className="min-w-0 flex-1 truncate t-body text-ink hover:text-brand-text">
        {lesson.title}
      </Link>
      <span className="hidden t-caption text-ink-faint md:inline">{fmtDuration(lesson.durationSec)}</span>
      {release && <span className="hidden t-caption text-ink-faint lg:inline">{release}</span>}
      {lesson.videoStatus !== "pronto" && <Badge tone="neutral" icon={false}>{lesson.videoStatus === "aguardando" ? "sem vídeo" : lesson.videoStatus === "processando" ? "processando" : "erro no vídeo"}</Badge>}
      <Badge tone={lesson.status === "publicada" ? "success" : "neutral"} icon={false}>
        {lesson.status === "publicada" ? "Publicada" : "Rascunho"}
      </Badge>
    </div>
  );
}
