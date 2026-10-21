export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="relative hidden overflow-hidden bg-gradient-brand text-on-brand md:flex md:w-[44%] md:flex-col md:justify-between md:p-12">
        <span className="font-display text-2xl font-bold">Avix</span>
        <div className="relative">
          <svg className="absolute -right-6 -top-40 opacity-90" width="320" height="240" viewBox="0 0 320 240" aria-hidden>
            <defs>
              <linearGradient id="ga" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#8fe3dd" />
                <stop offset="1" stopColor="#45b0ab" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="200" height="56" rx="14" fill="url(#ga)" />
            <rect x="0" y="72" width="120" height="12" rx="6" fill="#fffbf2" opacity=".25" />
            <rect x="0" y="72" width="80" height="12" rx="6" fill="url(#ga)" />
            <rect x="0" y="100" width="120" height="12" rx="6" fill="#fffbf2" opacity=".25" />
            <rect x="0" y="100" width="40" height="12" rx="6" fill="url(#ga)" />
            <rect x="0" y="128" width="120" height="12" rx="6" fill="#fffbf2" opacity=".25" />
            <rect x="0" y="128" width="112" height="12" rx="6" fill="url(#ga)" />
          </svg>
          <p className="t-display max-w-md">Do que foi dito ao que foi feito.</p>
          <p className="mt-4 max-w-sm t-body-lg opacity-85">Mentoria em Marketing, Vendas e Tecnologia com plano de ação no seu calendário.</p>
        </div>
        <span className="t-caption opacity-70">Made Comunicação</span>
      </aside>
      <main className="flex flex-1 items-center justify-center px-4 py-10 md:px-12">
        <div className="w-full max-w-sm">
          <span className="mb-8 block font-display text-2xl font-bold text-brand-text md:hidden">Avix</span>
          {children}
        </div>
      </main>
    </div>
  );
}
