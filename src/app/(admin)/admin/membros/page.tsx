import Link from "next/link";
import { Search, UserPlus, Users } from "lucide-react";
import { PageHeader, Card, Badge, Avatar, EmptyState } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { listMembers, listTracksBasic } from "@/modules/members/queries";
import { fmtDate, fmtRelative, fmtPhone } from "@/lib/format";

export const metadata = { title: "Membros" };

const statusTone = { ativo: "success", pausado: "warning", expirado: "danger" } as const;
const statusLabel = { ativo: "Ativo", pausado: "Pausado", expirado: "Expirado" } as const;

export default async function MembrosPage(props: { searchParams: Promise<{ q?: string; status?: string; trilha?: string }> }) {
  const sp = await props.searchParams;
  const status = (["ativo", "pausado", "expirado", "todos"].includes(sp.status ?? "") ? sp.status : "todos") as "ativo" | "pausado" | "expirado" | "todos";
  const [members, tracks] = await Promise.all([listMembers({ q: sp.q, status, track: sp.trilha }), listTracksBasic()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Admin", href: "/admin" }, { label: "Membros" }]}
        title="Membros"
        actions={<ButtonLink href="/admin/membros/novo" icon={<UserPlus className="size-4" strokeWidth={2.2} />}>Cadastrar membro</ButtonLink>}
      />

      <form className="flex flex-wrap items-end gap-3" role="search">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" aria-hidden />
          <Input name="q" defaultValue={sp.q} placeholder="Nome, e-mail ou WhatsApp" className="pl-10" aria-label="Buscar membros" />
        </div>
        <Select name="status" defaultValue={status} aria-label="Status" className="w-40">
          <option value="todos">Todos os status</option>
          <option value="ativo">Ativos</option>
          <option value="pausado">Pausados</option>
          <option value="expirado">Expirados</option>
        </Select>
        <Select name="trilha" defaultValue={sp.trilha ?? ""} aria-label="Trilha" className="w-44">
          <option value="">Todas as trilhas</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.slug}>
              {t.name}
            </option>
          ))}
        </Select>
        <button type="submit" className="min-h-11 rounded-[10px] border border-border-strong bg-surface-200 px-4 t-button">
          Filtrar
        </button>
      </form>

      {members.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" strokeWidth={1.75} />}
          title={sp.q || sp.trilha || status !== "todos" ? "Nenhum membro com esses filtros" : "Nenhum membro ainda"}
          description={sp.q || sp.trilha || status !== "todos" ? "Tente outra busca ou limpe os filtros." : "Cadastre o primeiro aluno: nome, e-mail, WhatsApp, trilhas e período de acesso. Ele recebe o convite por e-mail para criar a senha."}
          action={<ButtonLink href="/admin/membros/novo" icon={<UserPlus className="size-4" />}>Cadastrar membro</ButtonLink>}
        />
      ) : (
        <Card className="overflow-x-auto p-0 md:p-0">
          <table className="w-full min-w-[760px] border-collapse t-body-sm">
            <thead>
              <tr className="text-left">
                {["Membro", "WhatsApp", "Trilhas", "Status", "Acesso", "Último acesso", "Aulas"].map((h) => (
                  <th key={h} className="border-b border-border px-4 py-3 t-caption text-ink-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-surface-100">
                  <td className="border-b border-border px-4 py-3">
                    <Link href={`/admin/membros/${m.id}`} className="flex items-center gap-3 text-ink">
                      <Avatar name={m.name} src={m.avatarUrl} size={36} />
                      <span className="flex flex-col">
                        <span className="font-semibold">{m.name}</span>
                        <span className="t-caption text-ink-faint">{m.email}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="border-b border-border px-4 py-3 font-mono text-[13px]">{fmtPhone(m.whatsapp)}</td>
                  <td className="border-b border-border px-4 py-3">
                    <span className="flex flex-wrap gap-1">
                      {m.tracks.length ? m.tracks.map((t) => <Badge key={t.id} tone="brand">{t.name}</Badge>) : <span className="text-ink-faint">—</span>}
                    </span>
                  </td>
                  <td className="border-b border-border px-4 py-3">
                    <Badge tone={statusTone[m.status]}>{statusLabel[m.status]}</Badge>
                    {!m.onboardingDone && m.inviteSentAt && <span className="ml-2 t-caption text-ink-faint">convite enviado</span>}
                    {!m.inviteSentAt && <span className="ml-2 t-caption text-warning">sem convite</span>}
                  </td>
                  <td className="border-b border-border px-4 py-3 text-ink-muted">
                    {fmtDate(m.accessStart)} – {fmtDate(m.accessEnd)}
                  </td>
                  <td className="border-b border-border px-4 py-3 text-ink-muted">{fmtRelative(m.lastSeenAt)}</td>
                  <td className="border-b border-border px-4 py-3 text-ink-muted">{m.lessonsDone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
