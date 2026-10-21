import { notFound } from "next/navigation";
import { Eye } from "lucide-react";
import { PageHeader, Badge } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { getLessonAdmin, listModulesForSelect } from "@/modules/content/queries";
import { bunnyConfigured } from "@/lib/video/bunny";
import { LessonForm } from "../lesson-form";

export default async function AulaAdminPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [lesson, modules] = await Promise.all([getLessonAdmin(id), listModulesForSelect()]);
  if (!lesson) notFound();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Admin", href: "/admin" }, { label: "Conteúdos", href: "/admin/conteudos" }, { label: lesson.module.track.name }, { label: lesson.module.title }, { label: lesson.title }]}
        title={lesson.title}
        actions={
          <>
            <Badge tone={lesson.status === "publicada" ? "success" : "neutral"} icon={false} className="self-center">
              {lesson.status === "publicada" ? "Publicada" : "Rascunho"}
            </Badge>
            <ButtonLink href={`/admin/conteudos/aulas/${id}/previa`} variant="secondary" icon={<Eye className="size-4" />}>
              Ver como aluno
            </ButtonLink>
          </>
        }
      />
      <LessonForm
        modules={modules}
        lessonId={id}
        bunnyConfigured={bunnyConfigured()}
        initial={{
          moduleId: lesson.moduleId,
          title: lesson.title,
          description: lesson.description,
          status: lesson.status,
          releaseAt: lesson.releaseAt?.toISOString() ?? null,
          releaseAfterDays: lesson.releaseAfterDays,
          materials: lesson.materials.map((m) => ({ id: m.id, type: m.type, label: m.label, url: m.url })),
          videoId: lesson.videoId,
          videoStatus: lesson.videoStatus,
          durationSec: lesson.durationSec,
        }}
      />
    </div>
  );
}
