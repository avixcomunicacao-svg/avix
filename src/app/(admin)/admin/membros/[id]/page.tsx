import { notFound } from "next/navigation";
import { Mail, MessageCircle } from "lucide-react";
import { PageHeader, Card, Badge, Avatar } from "@/components/ui/primitives";
import { getMember, listTracksBasic } from "@/modules/members/queries";
import { getMemberProgress } from "@/modules/content/queries";
import { fmtDate, fmtRelative, fmtPhone } from "@/lib/format";
import { MemberForm } from "../member-form";
import { MemberActions } from "./member-actions";
import { ProgressBar } from "@/components/ui/primitives";

const statusTone = { ativo: "success", pausado: "warning", expirado: "danger" } as const;
const statusLabel = { ativo: "Ativo", pausado: "Pausado", expirado: "Expirado" } as const;
const DAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export default async function MembroPage(props: { params: Promise<{ id: string }>; searchParams: Promise<{ novo?: string; aba?: string }> }) {
  const { id } = await props.params;
  const { novo, aba } = await props.searchParams;
  const [m, tracks] = await Promise.all([getMember(id), listTracksBasic()]);
  if (!m) notFound();
  const progress = await getMemberProgress(id);
  const p = m.profile;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader crumbs={[{ label: "Admin", href: "/admin" }, { label: "Membros", href: "/admin/membros" }, { label: m.name }]} title={m.name} />

      {novo && (
        <p className="rounded-[14px] bg-accent-soft px-4 py-3 t-body text-accent-text" role="status">
          Membro cadastrado. {p.inviteSentAt ? "O convite foi enviado por e-mail." : "O convite ainda não foi enviado — use o botão ao lado."}
        </p>
      )}

      <Card className="flex flex-wrap items-center gap-5">
        <Avatar name={m.name} src={m.avatarUrl} size={64} brand />
        <div className="flex min-w-60 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone[p.status]}>{statusLabel[p.status]}</Badge>
            {m.tracks.map((t) => (
              <Badge key={t.id} tone="brand">{t.name}</Badge>
            ))}
            {p.isMadeClient && <Badge tone="neutral">Cliente Made</Badge>}
          </div>
          <span className="t-body-sm text-ink-muted">
            Acesso {fmtDate(p.accessStart)} – {fmtDate(p.accessEnd)} · último acesso {fmtRelative(p.lastSeenAt)} ·{" "}
            {p.onboardingDone ? "onboarding concluído" : p.inviteSentAt ? `convite enviado ${fmtRelative(p.inviteSentAt)}` : "convite não enviado"}
          </span>
          <span className="flex flex-wrap gap-4 t-body-sm">
            <a href={`https://wa.me/${p.whatsappE164.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5">
              <MessageCircle className="size-4" /> {fmtPhone(p.whatsappE164)}
            </a>
            <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5">
              <Mail className="size-4" /> {m.email}
            </a>
          </span>
        </div>
        <MemberActions id={m.id} status={p.status} inviteSent={!!p.inviteSentAt} />
      </Card>

      <div className="flex gap-1 overflow-x-auto border-b border-border" role="tablist">
        {[
          { k: "visao", l: "Visão geral" },
          { k: "dados", l: "Dados e acesso" },
        ].map((t) => {
          const on = (aba ?? "visao") === t.k;
          return (
            <a key={t.k} href={`?aba=${t.k}`} role="tab" aria-selected={on} className={`min-h-10 border-b-2 px-3.5 pt-2 t-label ${on ? "border-brand-text text-brand-text" : "border-transparent text-ink-muted"}`}>
              {t.l}
            </a>
          );
        })}
      </div>

      {(aba ?? "visao") === "visao" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="flex flex-col gap-3">
            <h2 className="t-h3">Objetivo</h2>
            <p className="t-body text-ink-muted">{p.goals || <span className="text-ink-faint">O aluno ainda não escreveu o objetivo.</span>}</p>
            <div className="border-t border-border pt-3">
              <span className="t-label text-ink-muted">Disponibilidade · {m.availability?.hoursPerWeek ?? 4} h/semana</span>
              <div className="mt-2 grid grid-cols-7 gap-1.5">
                {DAYS.map((d, i) => {
                  const on = (m.availability?.weekdays ?? [1, 2, 3, 4, 5]).includes(i);
                  return (
                    <span key={i} className={`grid h-8 place-items-center rounded-[6px] text-[12px] font-semibold ${on ? "bg-gradient-accent text-on-accent" : "bg-surface-300 text-ink-faint"}`}>
                      {d}
                    </span>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="t-h3">Progresso nas aulas</h2>
            {progress.byTrack.length === 0 ? (
              <p className="t-body-sm text-ink-faint">Sem trilhas vinculadas ou sem aulas publicadas.</p>
            ) : (
              progress.byTrack.map((t) => <ProgressBar key={t.trackId} label={t.name} value={t.total ? (t.done / t.total) * 100 : 0} caption={`${t.done} de ${t.total} aulas concluídas`} />)
            )}
          </Card>

          <Card className="flex flex-col gap-3 bg-surface-100">
            <h2 className="t-h3">Notas privadas</h2>
            <p className="whitespace-pre-wrap t-body-sm">{p.notesPrivate || <span className="text-ink-faint">Nenhuma nota. Edite em "Dados e acesso".</span>}</p>
            <span className="t-caption text-ink-faint">Só você vê. Nunca aparece para o aluno.</span>
          </Card>

          <Card className="flex flex-col gap-3 lg:col-span-3">
            <h2 className="t-h3">Plano de ação, mentorias e atas</h2>
            <p className="t-body-sm text-ink-muted">Aparecem aqui a partir das fases 3 e 4 (mentorias ao vivo e IA). A estrutura já está pronta no banco.</p>
          </Card>
        </div>
      ) : (
        <MemberForm
          tracks={tracks}
          memberId={m.id}
          initial={{
            name: m.name,
            email: m.email,
            whatsapp: p.whatsappE164,
            accessStart: p.accessStart,
            accessEnd: p.accessEnd,
            goals: p.goals,
            notesPrivate: p.notesPrivate,
            isMadeClient: p.isMadeClient,
            trackIds: m.tracks.map((t) => t.id),
          }}
        />
      )}
    </div>
  );
}
