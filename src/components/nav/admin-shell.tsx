"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, LogOut, Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import { adminNav } from "./icons";
import { Avatar } from "@/components/ui/primitives";
import { signOut } from "@/modules/auth/actions";

type Props = { user: { name: string; avatarUrl: string | null }; brandName: string; children: React.ReactNode };

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

export function AdminShell({ user, brandName, children }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-0.5" aria-label="Admin">
      {adminNav.map(({ href, label, icon: Icon, ...rest }) => {
        const on = isActive(pathname, href, "exact" in rest ? rest.exact : false);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            title={collapsed ? label : undefined}
            onClick={() => setOpen(false)}
            className={cn(
              "flex min-h-11 items-center gap-2.5 rounded-[10px] px-3 t-body font-medium text-on-brand/80 transition-[background,opacity] duration-150 hover:bg-on-brand/10",
              on && "bg-on-brand/15 font-semibold text-on-brand",
              collapsed && "justify-center px-0",
            )}
          >
            <Icon className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
            {!collapsed && label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-dvh bg-surface-000">
      {/* Lateral desktop */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col bg-gradient-brand p-3 text-on-brand transition-[width] duration-250 ease-avix md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className={cn("flex items-center justify-between px-2 pb-5 pt-2", collapsed && "justify-center px-0")}>
          {!collapsed && (
            <span className="font-display text-xl font-bold">
              {brandName} <span className="ml-1 align-middle text-[11px] font-semibold tracking-wider opacity-70">ADMIN</span>
            </span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            className="grid size-8 place-items-center rounded-[8px] opacity-70 hover:bg-on-brand/10 hover:opacity-100"
          >
            <ChevronLeft className={cn("size-4 transition-transform duration-250", collapsed && "rotate-180")} />
          </button>
        </div>
        {nav}
        <div className={cn("mt-auto flex items-center gap-3 px-2 pt-3", collapsed && "justify-center px-0")}>
          <Avatar name={user.name} src={user.avatarUrl} size={36} className="bg-gradient-accent text-on-accent" />
          {!collapsed && (
            <span className="flex min-w-0 flex-col">
              <span className="truncate t-body-sm font-semibold">{user.name}</span>
              <span className="t-caption opacity-70">Mentor</span>
            </span>
          )}
          {!collapsed && (
            <form action={signOut} className="ml-auto">
              <button aria-label="Sair" className="grid size-8 place-items-center rounded-[8px] opacity-70 hover:bg-on-brand/10 hover:opacity-100">
                <LogOut className="size-4" />
              </button>
            </form>
          )}
        </div>
      </aside>

      {/* Gaveta celular */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button aria-label="Fechar menu" className="absolute inset-0 bg-overlay" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-gradient-brand p-3 text-on-brand shadow-lg">
            <div className="flex items-center justify-between px-2 pb-5 pt-2">
              <span className="font-display text-xl font-bold">{brandName}</span>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="grid size-9 place-items-center rounded-[8px] hover:bg-on-brand/10">
                <X className="size-5" />
              </button>
            </div>
            {nav}
            <form action={signOut} className="mt-auto">
              <button className="flex min-h-11 w-full items-center gap-2.5 rounded-[10px] px-3 t-body opacity-80 hover:bg-on-brand/10">
                <LogOut className="size-5" /> Sair
              </button>
            </form>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center gap-3 border-b border-border bg-surface-000/90 px-4 py-2 backdrop-blur md:px-8">
          <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="grid size-11 place-items-center rounded-[10px] text-ink-muted md:hidden">
            <Menu className="size-6" />
          </button>
          <Link href="/admin/buscar" className="flex min-h-11 flex-1 items-center gap-2.5 rounded-[10px] border border-border bg-surface-100 px-3.5 text-ink-faint md:max-w-xl">
            <Search className="size-[18px] shrink-0" strokeWidth={1.75} />
            <span className="truncate t-body-sm">Buscar membros, aulas, atas, transcrições…</span>
            <kbd className="ml-auto hidden rounded-[6px] border border-border px-1.5 font-mono text-[12px] md:inline">⌘K</kbd>
          </Link>
          <div id="admin-header-actions" className="ml-auto flex items-center gap-2" />
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
