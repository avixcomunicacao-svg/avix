import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/ui/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[10px] border border-transparent t-button cursor-pointer select-none transition-[background,box-shadow,color] duration-150 ease-avix disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-gradient-accent text-on-accent shadow-sm hover:brightness-[1.04]",
  secondary: "bg-surface-200 text-ink border-border-strong hover:bg-surface-100",
  ghost: "bg-transparent text-brand-text hover:bg-brand-soft",
  danger: "bg-transparent text-danger border-danger hover:bg-danger-soft",
};
const sizes: Record<Size, string> = {
  md: "min-h-11 px-5 py-3",
  sm: "min-h-9 px-4 py-2 text-[13px] leading-4",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
};

export function Button({ variant = "primary", size = "md", loading, icon, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  href,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size; icon?: React.ReactNode }) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {icon}
      {children}
    </Link>
  );
}

export function IconButton({ label, className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "inline-grid size-11 place-items-center rounded-[10px] text-ink-muted hover:bg-surface-100 transition-colors duration-150 cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
