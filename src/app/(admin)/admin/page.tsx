import Link from "next/link";
import { BookOpen, Plus, UserPlus, Video } from "lucide-react";
import { PageHeader, Card, EmptyState } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { countMembers } from "@/modules/members/queries";
import { getContentStats } from "@/modules/content/queries";

export const metadata = { title: "Dashboard" };

export default async function AdminHome() {
  const [activeMembers, content] = await Promise.all([countMembers(), getContentStats()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader crumbs={[{ label: "Admin" }]} title="Dashboard" actions={<ButtonLink href="/admin/conteudos/nova-aula" icon={<Plus className="size-4" strokeWidth={2.2} />}>Nova aula</ButtonLink>} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="flex flex-col gap-1.5">
          <span className="t-label text-ink-muted">Membros ativos</span>
          <span className="t-numeral">{activeMembers}</span>
          <Link href="/admin/membros" className="t-caption">Ver membros →</Link>
        </Card>
        <Card className="flex flex-col gap-1.5">
          <span className="t-label text-ink-muted">Trilhas</span>
          <span className="t-numeral">{content.tracks}</span>
          <Link href="/admin/conteudos" className="t-caption">Ver conteúdos →</Link>
        </Card>
        <Card className="flex flex-col gap-1.5">
          <span className="t-label text-ink-muted">Aulas publicadas</span>
          <span className="t-numeral">{content.lessonsPublished}</span>
          <span className="t-caption text-ink-faint">{content.lessonsDraft} em rascunho</span>
        </Card>
        <Card className="flex flex-col gap-1.5">
          <span className="t-label text-ink-muted">Aulas concluídas</span>
          <span className="t-numeral">{content.completions}</span>
          <span className="t-caption text-ink-faint">por todos os membros</span>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <EmptyState
          icon={<Video className="size-6" strokeWidth={1.75} />}
          title="Participação, rendimento e satisfação"
          description="Os indicadores do dashboard entram na fase 2, assim que houver avaliações e plano de ação. Enquanto isso, comece pelos membros e pela estrutura das trilhas."
          action={<ButtonLink href="/admin/membros/novo" variant="secondary" icon={<UserPlus className="size-4" />}>Cadastrar membro</ButtonLink>}
        />
        <EmptyState
          icon={<BookOpen className="size-6" strokeWidth={1.75} />}
          title="Conteúdo nasce das mentorias"
          description="Não há aulas ainda. As gravações das mentorias em grupo poderão ser publicadas como aula com um clique (fase 3). Até lá, você pode montar trilhas e módulos."
          action={<ButtonLink href="/admin/conteudos" variant="secondary">Organizar trilhas</ButtonLink>}
        />
      </div>
    </div>
  );
}
