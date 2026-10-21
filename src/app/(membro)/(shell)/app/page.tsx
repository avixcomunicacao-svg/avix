import Link from "next/link";
import { BookOpen, ClipboardCheck, Play, Video } from "lucide-react";
import { requireMember } from "@/modules/auth/session";
import { memberTracksWithProgress, memberAnnouncements } from "@/modules/content/queries";
import { Card, EmptyState, ProgressBar, Section } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { firstName, fmtDate, fmtWeekdayLong, greeting } from "@/lib/format";

export const metadata = { title: "Início" };

export default async function InicioPage() {
  const { user } = await requireMember();
  const [{ tracks, continueLesson }, announcements] = await Promise.all([memberTracksWithProgress(user.id), memberAnnouncements()]);
  const hasLessons = tracks.some((t) => t.total > 0);

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div>
        <p className="t-caption text-ink-faint">{fmtWeekdayLong(new Date())}</p>
        <h1 className="mt-1 t-display">
          {greeting()}, {firstName(user.name)}
        </h1>
      </div>

      {/* Próxima mentoria — fase 3 preenche; hoje, estado vazio com cara de cartão */}
      <section className="relative overflow-hidden rounded-[20px] bg-gradient-brand p-5 text-on-brand">
        <p className="t-caption opacity-85">Próxima mentoria</p>
        <h2 className="mt-2 t-h2">Nenhuma mentoria agendada</h2>
        <p className="mt-2 max-w-md t-body-sm opacity-85">Quando o mentor agendar uma mentoria individual ou em grupo da sua trilha, ela aparece aqui com o botão do Meet.</p>
        <Link href="/app/mentorias" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-on-brand/15 px-4 t-button text-on-brand hover:bg-on-brand/25">
          <Video className="size-5" /> Ver mentorias
        </Link>
      </section>

      <Section title="Ações de hoje" action={<Link href="/app/plano" className="t-label">Ver plano →</Link>}>
        <EmptyState
          icon={<ClipboardCheck className="size-6" strokeWidth={1.75} />}
          title="Seu plano ainda está vazio"
          description="Depois da primeira mentoria ou conversa com o mentor, as orientações viram ações aqui, distribuídas nos dias que você escolheu."
        />
      </Section>

      {continueLesson && (
        <Section title="Continuar assistindo">
          <Link href={`/app/aulas/${continueLesson.id}`} className="block text-ink">
            <Card interactive className="flex items-center gap-3.5 p-3 md:p-3">
              <span className="relative grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-gradient-brand text-on-brand">
                <span className="absolute -right-3.5 -top-3.5 size-11 rounded-[10px] bg-gradient-accent" />
                <Play className="relative size-6 fill-current" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="t-caption text-ink-faint">
                  {continueLesson.trackName} · {continueLesson.moduleTitle}
                </span>
                <span className="t-h3 truncate">{continueLesson.title}</span>
                <ProgressBar value={continueLesson.duration_sec ? (continueLesson.positionSec / continueLesson.duration_sec) * 100 : 0} />
              </span>
            </Card>
          </Link>
        </Section>
      )}

      <Section title="Seu progresso" action={<Link href="/app/aulas" className="t-label">Ver aulas →</Link>}>
        {tracks.length === 0 ? (
          <EmptyState icon={<BookOpen className="size-6" strokeWidth={1.75} />} title="Nenhuma trilha liberada" description="O mentor ainda não vinculou você a uma trilha. Fale com ele pelo botão verde." />
        ) : !hasLessons ? (
          <EmptyState
            icon={<BookOpen className="size-6" strokeWidth={1.75} />}
            title="As aulas chegam com as mentorias"
            description="Suas trilhas estão prontas, mas ainda não há aulas publicadas. As gravações das mentorias em grupo viram aulas aqui."
            action={<ButtonLink href="/app/mentorias" variant="secondary">Ver mentorias</ButtonLink>}
          />
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {tracks.map((t) => (
              <Link key={t.id as string} href={`/app/aulas#${t.slug}`} className="text-ink">
                <Card interactive className="flex flex-col gap-2 p-3.5 md:p-4">
                  <span className="t-caption text-ink-muted">{t.name as string}</span>
                  <span className="font-display text-2xl font-semibold leading-7 text-accent-text">{t.pct}%</span>
                  <ProgressBar value={t.pct} />
                  <span className="t-caption text-ink-faint">
                    {t.done} de {t.total} · {t.total ? "" : "sem aulas"}
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {announcements.length > 0 && (
        <Section title="Avisos do mentor">
          <div className="flex flex-col gap-3">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-[14px] bg-brand-soft p-4">
                <span className="t-caption text-brand-text">
                  {a.title ?? "Aviso"} · {fmtDate(a.published_at)}
                </span>
                <p className="mt-1.5 t-body">{a.body}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

