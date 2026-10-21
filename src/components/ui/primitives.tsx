import * as React from "react";
import { AlertTriangle, Check, Clock } from "lucide-react";
import { cn } from "@/lib/ui/cn";

/* ---------- Card ---------- */
export function Card({ className, interactive, ...props }: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-border bg-surface-200 p-4 md:p-5",
        interactive && "transition-[box-shadow,border-color] duration-150 hover:border-border-strong hover:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

/* ---------- Badge ---------- */
type Tone = "success" | "warning" | "danger" | "accent" | "brand" | "neutral";
const tones: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  accent: "bg-accent-soft text-accent-text",
  brand: "bg-brand-soft text-brand-text",
  neutral: "bg-surface-300 text-ink-muted",
};
const toneIcons: Partial<Record<Tone, React.ReactNode>> = {
  success: <Check className="size-3.5" strokeWidth={2.5} aria-hidden />,
  warning: <Clock className="size-3.5" aria-hidden />,
  danger: <AlertTriangle className="size-3.5" aria-hidden />,
};
export function Badge({ tone = "neutral", icon, className, children }: { tone?: Tone; icon?: React.ReactNode | false; className?: string; children: React.ReactNode }) {
  const ic = icon === false ? null : (icon ?? toneIcons[tone]);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1 t-label whitespace-nowrap", tones[tone], className)}>
      {ic}
      {children}
    </span>
  );
}

/* ---------- Progress ---------- */
export function ProgressBar({ value, label, caption, className }: { value: number; label?: string; caption?: string; className?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {(label || label === "") && (
        <div className="flex items-baseline justify-between">
          <span className="t-label">{label}</span>
          <span className="t-label text-accent-text">{v}%</span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-surface-300" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-gradient-progress transition-[width] duration-200 ease-avix" style={{ width: `${v}%` }} />
      </div>
      {caption && <span className="t-caption text-ink-faint">{caption}</span>}
    </div>
  );
}

export function ProgressRing({ value, size = 88, label }: { value: number; size?: number; label?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const id = React.useId();
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={label ?? `${v}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8fe3dd" />
            <stop offset="1" stopColor="#45b0ab" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-300)" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} />
      </svg>
      <div className="absolute inset-0 grid place-items-center font-display font-semibold text-accent-text" style={{ fontSize: size * 0.25, letterSpacing: "-0.02em" }}>
        {v}%
      </div>
    </div>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ name, src, size = 40, className, brand }: { name: string; src?: string | null; size?: number; className?: string; brand?: boolean }) {
  const ini = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} width={size} height={size} className={cn("rounded-full object-cover", className)} style={{ width: size, height: size }} />
  ) : (
    <span
      className={cn("grid place-items-center rounded-full font-semibold", brand ? "bg-gradient-brand text-on-brand" : "bg-brand-soft text-brand-text", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-label={name}
    >
      {ini}
    </span>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon, title, description, action, className }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center rounded-[14px] border border-dashed border-border-strong px-6 py-8 text-center", className)}>
      <div className="mb-4 grid size-14 place-items-center rounded-[10px] bg-brand-soft text-brand-text">{icon}</div>
      <h3 className="t-h3">{title}</h3>
      <p className="mt-1.5 max-w-sm t-body-sm text-ink-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------- Skeleton ---------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-3.5 w-full", className)} aria-hidden />;
}

/* ---------- Page header ---------- */
export function PageHeader({ crumbs, title, actions, children }: { crumbs?: { label: string; href?: string }[]; title: string; actions?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Caminho" className="t-caption text-ink-faint">
          {crumbs.map((c, i) => (
            <span key={i}>
              {c.href ? (
                <a href={c.href} className="text-ink-faint hover:text-ink">
                  {c.label}
                </a>
              ) : (
                c.label
              )}
              {i < crumbs.length - 1 && " › "}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="t-h1">{title}</h1>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/* ---------- Section ---------- */
export function Section({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="t-h2">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
