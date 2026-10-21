import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/ui/cn";

type FieldProps = {
  label: string;
  help?: string;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
};

export function Field({ label, help, error, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="t-label text-ink-muted">
        {label}
      </label>
      {children}
      {error ? (
        <span className="flex items-center gap-1.5 t-body-sm text-danger" role="alert">
          <AlertTriangle className="size-4" aria-hidden /> {error}
        </span>
      ) : help ? (
        <span className="t-body-sm text-ink-faint">{help}</span>
      ) : null}
    </div>
  );
}

const inputBase =
  "min-h-11 w-full rounded-[10px] border border-border-strong bg-surface-100 px-4 py-3 t-body text-ink placeholder:text-ink-faint transition-colors duration-150 focus:border-brand disabled:opacity-60 aria-[invalid=true]:border-danger";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }>(function Input({ className, mono, ...props }, ref) {
  return <input ref={ref} className={cn(inputBase, mono && "font-mono text-[13px]", className)} {...props} />;
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(inputBase, "min-h-24 resize-y", className)} {...props} />;
});

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...props }, ref) {
  return <select ref={ref} className={cn(inputBase, "appearance-none bg-no-repeat pr-10", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23473e54' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundPosition: "right 14px center" }} {...props} />;
});

export function Checkbox({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 t-body", className)}>
      <input type="checkbox" className="avix-checkbox mt-0.5 size-5 shrink-0 cursor-pointer" {...props} />
      <span>{label}</span>
    </label>
  );
}
