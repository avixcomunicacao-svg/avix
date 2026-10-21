import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, FileText, Link2 } from "lucide-react";
import { requireMember } from "@/modules/auth/session";
import { memberLesson } from "@/modules/content/queries";
import { bunnyConfigured, signedEmbedUrl } from "@/lib/video/bunny";
import { Card, Section } from "@/components/ui/primitives";
import { LessonPlayer } from "@/components/video/lesson-player";
import { LessonControls } from "./lesson-controls";

export default async function AulaPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { user } = await requireMember();
  const data = await memberLesson(user.id, id);
  if (!data) notFound(); // RLS: aula de outra trilha, não liberada ou inexistente → 404
  const { lesson, module, track, materials, progress, rating, position, next, prev } = data;

  const ready = lesson.video_status === "pronto" && !!lesson.video_id && bunnyConfigured();
  const embedUrl = ready ? signedEmbedUrl(lesson.video_id as string, { ttlSec: 4 * 3600 }) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-1">
        <Link href="/app/aulas" aria-label="Voltar para Aulas" className="-ml-2 grid size-11 place-items-center rounded-[10px] text-ink-muted hover:bg-surface-100">
          <ChevronLeft className="size-6" />
        </Link>
        <div className="flex min-w-0 flex-col">
          <span className="t-caption text-ink-faint">
            {track?.name} · {module?.title} · Aula {position.index} de {position.total}
          </span>
          <h1 className="t-h3 truncate md:t-h1">{lesson.title}</h1>
        </div>
      </div>

      {embedUrl ? (
        <LessonPlayer embedUrl={embedUrl} lessonId={id} startSec={progress?.completed_at ? 0 : (progress?.position_sec ?? 0)} />
      ) : (
        <div className="grid aspect-video w-full place-items-center rounded-[20px] bg-gradient-ink p-6 text-center text-on-brand">
          <div>
            <p className="t-h3">Vídeo em preparação</p>
            <p className="mt-1 t-body-sm opacity-80">{lesson.video_status === "processando" ? "O vídeo está sendo processado. Volte em alguns minutos." : "O mentor ainda não enviou o vídeo desta aula."}</p>
          </div>
        </div>
      )}

      <LessonControls lessonId={id} completed={!!progress?.completed_at} initialScore={rating?.score ?? 0} initialComment={rating?.comment ?? ""} nextHref={next ? `/app/aulas/${next.id}` : null} />

      {lesson.description && (
        <Section title="Sobre a aula">
          <p className="t-body-lg text-ink-muted">{lesson.description}</p>
        </Section>
      )}

      {materials.length > 0 && (
        <Section title="Materiais">
          <div className="flex flex-col gap-2.5">
            {materials.map((m) => (
              <a key={m.id} href={m.url} target="_blank" rel="noopener" className="text-ink">
                <Card interactive className="flex items-center gap-3 p-3 md:p-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[6px] bg-brand-soft text-brand-text">{m.type === "file" ? <FileText className="size-[18px]" strokeWidth={1.75} /> : <Link2 className="size-[18px]" strokeWidth={1.75} />}</span>
                  <span className="flex min-w-0 flex-col">
                    <span className="t-body font-semibold truncate">{m.label}</span>
                    <span className="t-caption text-ink-faint">{m.type === "file" ? "Arquivo" : "Link externo"}</span>
                  </span>
                </Card>
              </a>
            ))}
          </div>
        </Section>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        {prev ? (
          <Link href={`/app/aulas/${prev.id}`} className="inline-flex min-h-11 items-center gap-1.5 t-label">
            <ChevronLeft className="size-4" /> Aula anterior
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/app/aulas/${next.id}`} className="inline-flex min-h-11 items-center gap-1.5 t-label">
            Próxima aula <ChevronRight className="size-4" />
          </Link>
        ) : (
          <Link href="/app/aulas" className="inline-flex min-h-11 items-center gap-1.5 t-label">
            Voltar para a trilha
          </Link>
        )}
      </div>
    </div>
  );
}
