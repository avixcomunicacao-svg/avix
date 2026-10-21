import { PageHeader, Card, Badge } from "@/components/ui/primitives";
import { getSettings } from "@/modules/settings/queries";
import { bunnyConfigured } from "@/lib/video/bunny";
import { emailConfigured } from "@/lib/email";
import { fmtPhone } from "@/lib/format";

export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const s = await getSettings();
  const rows = [
    { name: "Supabase (banco e autenticação)", ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY), how: "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL" },
    { name: "E-mail (Resend)", ok: emailConfigured(), how: "RESEND_API_KEY e EMAIL_FROM" },
    { name: "Vídeo (Bunny Stream)", ok: bunnyConfigured(), how: "BUNNY_LIBRARY_ID, BUNNY_API_KEY, BUNNY_TOKEN_KEY, BUNNY_CDN_HOST" },
    { name: "Google (Agenda, Meet e Drive)", ok: false, how: "Fase 3 — OAuth do mentor nesta tela." },
    { name: "Made CRM / WhatsApp", ok: false, how: "Fase 5 — URL do webhook, segredo e teste de conexão." },
    { name: "IA (Anthropic) e transcrição (Deepgram)", ok: false, how: "Fase 4 — ANTHROPIC_API_KEY, DEEPGRAM_API_KEY." },
  ];
  return (
    <div className="flex flex-col gap-6">
      <PageHeader crumbs={[{ label: "Admin", href: "/admin" }, { label: "Configurações" }]} title="Configurações" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <h2 className="t-h3">Marca</h2>
          <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-2 t-body-sm">
            <dt className="text-ink-faint">Nome</dt><dd className="font-medium">{s.brand.name}</dd>
            <dt className="text-ink-faint">WhatsApp do mentor</dt><dd className="font-mono">{fmtPhone(s.mentorWhatsappE164)}</dd>
            <dt className="text-ink-faint">Aprovação da IA</dt><dd>{s.requireAiApproval ? "Exigir antes de publicar" : "Publicar direto e avisar"}</dd>
            <dt className="text-ink-faint">Sessão de WhatsApp</dt><dd>fecha após {s.sessionTimeoutHours} h sem mensagens</dd>
          </dl>
          <p className="t-caption text-ink-faint">Edição destes campos entra na fase 6 (acabamento). Por enquanto, altere direto na tabela settings.</p>
        </Card>
        <Card className="flex flex-col gap-3">
          <h2 className="t-h3">Integrações</h2>
          <ul className="flex flex-col divide-y divide-border">
            {rows.map((r) => (
              <li key={r.name} className="flex items-start justify-between gap-3 py-2.5">
                <span className="flex flex-col"><span className="t-body font-medium">{r.name}</span><span className="t-caption text-ink-faint">{r.how}</span></span>
                <Badge tone={r.ok ? "success" : "neutral"} icon={false}>{r.ok ? "Configurado" : "Pendente"}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
