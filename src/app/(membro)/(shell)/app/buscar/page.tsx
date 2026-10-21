import { Search } from "lucide-react";
import { requireMember } from "@/modules/auth/session";
import { memberTracksWithProgress } from "@/modules/content/queries";
import { Input } from "@/components/ui/field";
import { EmptyState, Card } from "@/components/ui/primitives";
import Link from "next/link";

export const metadata = { title: "Buscar" };

export default async function BuscarPage(props: { searchParams: Promise<{ q?: string }> }) {
  const { user } = await requireMember();
  const { q } = await props.searchParams;
  const { tracks } = await memberTracksWithProgress(user.id);
  const term = (q ?? "").trim().toLowerCase();
  const lessons = term
    ? tracks.flatMap((t) => t.modules.flatMap((m) => m.lessons.filter((l) => l.title.toLowerCase().includes(term) || (l.description ?? "").toLowerCase().includes(term)).map((l) => ({ ...l, trackName: t.name as string, moduleTitle: m.title as string }))))
    : [];
  return (
    <div className="flex flex-col gap-6">
      <h1 className="t-h1">Buscar</h1>
      <form className="relative" role="search">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-faint" aria-hidden />
        <Input name="q" defaultValue={q} autoFocus placeholder="Aulas, atas, trechos do que o mentor falou…" className="pl-12" aria-label="Buscar" />
      </form>
      {!term ? (
        <p className="t-body-sm text-ink-muted">Busque por aulas agora. Transcrições, atas e ações do plano entram na busca assim que existirem.</p>
      ) : lessons.length === 0 ? (
        <EmptyState icon={<Search className="size-6" strokeWidth={1.75} />} title="Nada encontrado" description={`Nenhuma aula com "${q}". Tente outra palavra.`} />
      ) : (
        <section className="flex flex-col gap-2">
          <h2 className="t-label text-ink-muted">Aulas · {lessons.length}</h2>
          {lessons.map((l) => (
            <Link key={l.id} href={`/app/aulas/${l.id}`} className="text-ink">
              <Card interactive className="flex flex-col gap-0.5 p-3.5 md:p-4">
                <span className="t-caption text-ink-faint">{l.trackName} · {l.moduleTitle}</span>
                <span className="t-body font-semibold">{l.title}</span>
              </Card>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
