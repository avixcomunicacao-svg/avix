"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Search } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import { memberNav } from "./icons";
import { Avatar } from "@/components/ui/primitives";

type Props = {
  user: { name: string; avatarUrl: string | null };
  mentorWhatsapp: string;
  brandName: string;
  children: React.ReactNode;
};

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

export function MemberShell({ user, mentorWhatsapp, brandName, children }: Props) {
  const pathname = usePathname();
  const wa = `https://wa.me/${mentorWhatsapp.replace(/\D/g, "")}`;

  return (
    <div className="flex min-h-dvh bg-surface-000">
      {/* Menu lateral (desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface-100 p-3 md:flex">
        <Link href="/app" className="px-2 pb-4 pt-2 font-display text-xl font-bold text-brand-text">
          {brandName}
        </Link>
        <nav className="flex flex-col gap-0.5" aria-label="Principal">
          {memberNav.map(({ href, label, icon: Icon, ...rest }) => {
            const on = isActive(pathname, href, "exact" in rest ? rest.exact : false);
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 rounded-[10px] px-3 t-body font-medium text-ink-muted transition-colors duration-150 hover:bg-surface-300",
                  on && "bg-brand-soft font-semibold text-brand-text",
                )}
              >
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <a
          href={wa}
          target="_blank"
          rel="noopener"
          className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-gradient-accent px-3 t-button text-on-accent shadow-sm"
        >
          <MessageCircle className="size-5" aria-hidden /> Falar com o mentor
        </a>
        <Link href="/app/perfil" className="mt-auto flex items-center gap-3 rounded-[10px] px-2 py-2 hover:bg-surface-300">
          <Avatar name={user.name} src={user.avatarUrl} size={36} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate t-body-sm font-semibold">{user.name}</span>
            <span className="t-caption text-ink-faint">Meu perfil</span>
          </span>
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Cabeçalho (celular) */}
        <header className="flex h-16 items-center justify-between px-4 md:hidden">
          <Link href="/app" className="font-display text-xl font-bold text-brand-text">
            {brandName}
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/app/buscar" aria-label="Buscar" className="grid size-11 place-items-center rounded-[10px] text-ink-muted">
              <Search className="size-[22px]" strokeWidth={1.75} />
            </Link>
            <Link href="/app/perfil" aria-label="Meu perfil">
              <Avatar name={user.name} src={user.avatarUrl} size={40} brand />
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 pb-40 pt-2 md:px-8 md:pb-16 md:pt-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>

        {/* Botão flutuante + barra inferior (celular) */}
        <a
          href={wa}
          target="_blank"
          rel="noopener"
          aria-label="Falar com o mentor"
          className="fixed bottom-20 right-4 z-30 grid size-13 place-items-center rounded-full bg-gradient-accent text-on-accent shadow-md md:hidden"
        >
          <MessageCircle className="size-6" aria-hidden />
        </a>
        <nav
          aria-label="Principal"
          className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-5 border-t border-border bg-surface-100 pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          {memberNav.map(({ href, label, icon: Icon, ...rest }) => {
            const on = isActive(pathname, href, "exact" in rest ? rest.exact : false);
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? "page" : undefined}
                className={cn("flex flex-col items-center justify-center gap-1 t-caption text-ink-faint", on && "text-brand-text")}
              >
                <Icon className="size-6" strokeWidth={1.75} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
