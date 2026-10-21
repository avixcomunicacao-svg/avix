import Link from "next/link";
import { Search } from "lucide-react";
import { PageHeader, Card, EmptyState, Avatar } from "@/components/ui/primitives";
import { Input } from "@/components/ui/field";
import { listMembers } from "@/modules/members/queries";
import { listTracksTree } from "@/modules/content/queries";

export const metadata = { title: "Buscar" };

export default async function BuscarAdminPage(props: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await props.searchParams;
  const term = (q ?? "").trim().toLowerCase();
  const [members, tree] = term ? await Promise.all([listMembers({ q: term }), listTracksTree()]) : [[], []];
  const lessons = tree.flatMap((t) => t.modules.flatMap((m) => m.lessons.filter((l) => l.title.toLowerCase().includes(term)).map((l) => ({ ...l, path: `${t.name} · ${m.title}` }))));
  return (
    <div className="flex flex-col gap-6">
      <PageHeader crumbs={[{ label: "Admin", href: "/admin" }, { label: "Buscar" }]} title="Buscar" />
      <form className="relative max-w-xl" role="search">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-faint" aria-hidden />
        <Input name="q" defaultValue={q} autoFocus placeholder="Membros, aulas, atas, transcrições…" className="pl-12" aria-label="Buscar" />
      </form>
      {!term ? null : members.length === 0 && lessons.length === 0 ? (
        <EmptyState icon={<Search className="size-6" strokeWidth={1.75} />} title="Nada encontrado" description={`Nenhum resultado para "${q}".`} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {members.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="t-label text-ink-muted">Membros · {members.length}</h2>
              {members.map((m) => (
                <Link key={m.id} href={`/admin/membros/${m.id}`} className="text-ink"><Card interactive className="flex items-center gap-3 p-3 md:p-3"><Avatar name={m.name} src={m.avatarUrl} size={36} /><span className="flex flex-col"><span className="t-body font-semibold">{m.name}</span><span className="t-caption text-ink-faint">{m.email}</span></span></Card></Link>
              ))}
            </section>
          )}
          {lessons.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="t-label text-ink-muted">Aulas · {lessons.length}</h2>
              {lessons.map((l) => (
                <Link key={l.id} href={`/admin/conteudos/aulas/${l.id}`} className="text-ink"><Card interactive className="flex flex-col gap-0.5 p-3 md:p-3"><span className="t-caption text-ink-faint">{l.path}</span><span className="t-body font-semibold">{l.title}</span></Card></Link>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
