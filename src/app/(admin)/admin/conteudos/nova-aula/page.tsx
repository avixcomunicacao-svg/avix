import { PageHeader, EmptyState } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { listModulesForSelect } from "@/modules/content/queries";
import { LessonForm } from "../aulas/lesson-form";
import { bunnyConfigured } from "@/lib/video/bunny";
import { BookOpen } from "lucide-react";

export const metadata = { title: "Nova aula" };

export default async function NovaAulaPage(props: { searchParams: Promise<{ modulo?: string }> }) {
  const { modulo } = await props.searchParams;
  const modules = await listModulesForSelect();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader crumbs={[{ label: "Admin", href: "/admin" }, { label: "Conteúdos", href: "/admin/conteudos" }, { label: "Nova aula" }]} title="Nova aula" />
      {modules.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-6" strokeWidth={1.75} />}
          title="Crie uma trilha e um módulo primeiro"
          description="Toda aula vive dentro de um módulo de uma trilha. Leva um minuto."
          action={<ButtonLink href="/admin/conteudos">Ir para Conteúdos</ButtonLink>}
        />
      ) : (
        <LessonForm modules={modules} defaultModuleId={modulo} bunnyConfigured={bunnyConfigured()} />
      )}
    </div>
  );
}
