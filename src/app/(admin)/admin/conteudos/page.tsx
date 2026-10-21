import { BookOpen, Plus } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { listTracksTree } from "@/modules/content/queries";
import { ContentTree } from "./content-tree";
import { NewTrackForm } from "./forms";

export const metadata = { title: "Conteúdos" };

export default async function ConteudosPage() {
  const tree = await listTracksTree();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Admin", href: "/admin" }, { label: "Conteúdos" }]}
        title="Conteúdos"
        actions={
          <>
            <NewTrackForm />
            <ButtonLink href="/admin/conteudos/nova-aula" icon={<Plus className="size-4" strokeWidth={2.2} />}>
              Nova aula
            </ButtonLink>
          </>
        }
      >
        <p className="t-body-sm text-ink-muted">Trilha → Módulo → Aula. Arraste para reordenar. O aluno só vê aulas publicadas das trilhas dele.</p>
      </PageHeader>

      {tree.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-6" strokeWidth={1.75} />}
          title="Nenhuma trilha ainda"
          description="Comece criando as trilhas (ex.: Marketing, Vendas, Tecnologia). Depois adicione módulos e aulas — ou publique gravações das mentorias como aula quando a fase 3 estiver no ar."
          action={<NewTrackForm primary />}
        />
      ) : (
        <ContentTree
          tracks={tree.map((t) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            description: t.description,
            memberCount: t.members.length,
            modules: t.modules.map((m) => ({
              id: m.id,
              title: m.title,
              description: m.description,
              lessons: m.lessons.map((l) => ({ id: l.id, title: l.title, status: l.status, durationSec: l.durationSec, videoStatus: l.videoStatus, releaseAt: l.releaseAt?.toISOString() ?? null, releaseAfterDays: l.releaseAfterDays })),
            })),
          }))}
        />
      )}
    </div>
  );
}
