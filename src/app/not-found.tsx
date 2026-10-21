import Link from "next/link";
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-surface-000 px-4 text-center">
      <div>
        <p className="t-caption text-ink-faint">404</p>
        <h1 className="mt-2 t-h1">Essa página não existe ou você não tem acesso a ela</h1>
        <p className="mt-2 t-body text-ink-muted">Se chegou aqui por um link, ele pode ter expirado.</p>
        <Link href="/app" className="mt-6 inline-flex min-h-11 items-center rounded-[10px] bg-gradient-accent px-5 t-button text-on-accent">Ir para o início</Link>
      </div>
    </main>
  );
}
