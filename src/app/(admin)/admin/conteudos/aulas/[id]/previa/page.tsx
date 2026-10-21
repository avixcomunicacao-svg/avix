import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getLessonAdmin } from "@/modules/content/queries";
import { bunnyConfigured, signedEmbedUrl } from "@/lib/video/bunny";
import { Section, Badge } from "@/components/ui/primitives";

export default async function PreviaPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const lesson = await getLessonAdmin(id);
  if (!lesson) notFound();
  const ready = lesson.videoStatus === "pronto" && lesson.videoId && bunnyConfigured();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href={`/admin/conteudos/aulas/${id}`} aria-label="Voltar" className="grid size-11 place-items-center rounded-[10px] text-ink-muted hover:bg-surface-100"><ChevronLeft className="size-6" /></Link>
        <div className="flex min-w-0 flex-col"><span className="t-caption text-ink-faint">Prévia · {lesson.module.track.name} · {lesson.module.title}</span><h1 className="t-h1 truncate">{lesson.title}</h1></div>
        <Badge tone="brand" icon={false} className="ml-auto">Como o aluno vê</Badge>
      </div>
      {ready ? (
        <div className="relative aspect-video overflow-hidden rounded-[20px] bg-gradient-ink"><iframe src={signedEmbedUrl(lesson.videoId!, { ttlSec: 3600 })} title="Prévia" className="absolute inset-0 size-full border-0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /></div>
      ) : (
        <div className="grid aspect-video place-items-center rounded-[20px] bg-gradient-ink text-on-brand"><p className="t-body-sm opacity-80">Sem vídeo pronto ainda.</p></div>
      )}
      {lesson.description && <Section title="Sobre a aula"><p className="t-body-lg text-ink-muted">{lesson.description}</p></Section>}
    </div>
  );
}
