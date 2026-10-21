import Link from "next/link";
import { BookOpen, Check, Play, Video } from "lucide-react";
import { requireMember } from "@/modules/auth/session";
import { memberTracksWithProgress } from "@/modules/content/queries";
import { Card, EmptyState, ProgressBar } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { fmtDuration } from "@/lib/format";
import { cn } from "@/lib/ui/cn";

export const metadata = { title: "Aulas" };

export default async function AulasPage() {
  const { user } = await requireMember();
  const { tracks, progress } = await memberTracksWithProgress(user.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="t-h1">Aulas</h1>

      {tracks.length === 0 ? (
        <EmptyState icon={<BookOpen className="size-6" strokeWidth={1.75} />} title="Nenhuma trilha liberada" description="O mentor ainda não vinculou você a uma trilha. Fale com ele pelo botão verde." />
      ) : (
        tracks.map((t) => (
          <section key={t.id as string} id={t.slug as string} className="flex flex-col gap-3">
            <div className="relative overflow-hidden rounded-[20px] bg-gradient-brand p-5 text-on-brand">
              <svg className="absolute -right-5 -top-5" width="160" height="160" viewBox="0 0 160 160" aria-hidden>
                <defs>
                  <linearGradient id={`g-${t.slug}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#8fe3dd" />
                    <stop offset="1" stopColor="#45b0ab" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="72" height="72" rx="14" fill={`url(#g-${t.slug})`} />
                <rect x="80" y="80" width="72" height="72" rx="14" fill="#fffbf2" opacity=".18" />
                <circle cx="116" cy="36" r="28" fill="#fffbf2" opacity=".12" />
              </svg>
              <p className="t-caption opacity-85">Trilha</p>
              <h2 className="relative mt-1 t-h2">{t.name as string}</h2>
              {t.description && <p className="relative mt-1 max-w-md t-body-sm opacity-85">{t.description as string}</p>}
              <div className="relative mt-4 max-w-sm">
                <div className="mb-1.5 flex justify-between t-caption opacity-90">
                  <span>
                    {t.done} de {t.total} aulas
                  </span>
                  <span>{t.pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-on-brand/20">
                  <div className="h-full rounded-full bg-gradient-progress" style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            </div>

            {t.total === 0 ? (
              <EmptyState
                icon={<Video className="size-6" strokeWidth={1.75} />}
                title="As aulas desta trilha chegam com as mentorias"
                description="Ainda não há aulas publicadas aqui. Quando o mentor gravar e publicar, você recebe um aviso."
                action={<ButtonLink href="/app/mentorias" variant="secondary">Ver mentorias</ButtonLink>}
              />
            ) : (
              t.modules
                .filter((m) => m.lessons.length)
                .map((m) => (
                  <Card key={m.id as string} className="flex flex-col gap-1 p-2 md:p-2">
                    <h3 className="px-2 pb-1 pt-2 t-h3">{m.title as string}</h3>
                    {m.lessons.map((l, i) => {
                      const p = progress.get(l.id);
                      const done = !!p?.completed_at;
                      const started = !done && (p?.position_sec ?? 0) > 0;
                      return (
                        <Link key={l.id} href={`/app/aulas/${l.id}`} className="flex min-h-14 items-center gap-3 rounded-[10px] px-2 py-2 text-ink transition-colors hover:bg-surface-100">
                          <span className={cn("grid size-9 shrink-0 place-items-center rounded-[8px] t-label", done ? "bg-gradient-accent text-on-accent" : "bg-surface-300 text-ink-muted")}>
                            {done ? <Check className="size-4" strokeWidth={2.5} /> : i + 1}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className={cn("t-body font-semibold truncate", done && "text-ink-muted")}>{l.title}</span>
                            <span className="t-caption text-ink-faint">
                              {fmtDuration(l.duration_sec)}
                              {started && l.duration_sec ? ` · ${Math.round(((p?.position_sec ?? 0) / l.duration_sec) * 100)}% assistido` : ""}
                            </span>
                          </span>
                          {started ? <Play className="size-5 text-accent-text" /> : null}
                          {started && l.duration_sec ? <ProgressBar value={((p?.position_sec ?? 0) / l.duration_sec) * 100} className="hidden w-24 md:flex" /> : null}
                        </Link>
                      );
                    })}
                  </Card>
                ))
            )}
          </section>
        ))
      )}
    </div>
  );
}
