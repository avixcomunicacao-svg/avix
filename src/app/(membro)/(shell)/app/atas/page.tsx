import { FileText, MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";
import { requireMember } from "@/modules/auth/session";
import { getSettings } from "@/modules/settings/queries";

export const metadata = { title: "Atas" };

export default async function AtasPage() {
  await requireMember();
  const settings = await getSettings();
  const wa = `https://wa.me/${settings.mentorWhatsappE164.replace(/\D/g, "")}`;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="t-h1">Atas</h1>
      <p className="t-body-sm text-ink-muted">Cada conversa com o mentor no WhatsApp vira uma ata. As orientações viram ações no seu plano.</p>
      <EmptyState
        icon={<FileText className="size-6" strokeWidth={1.75} />}
        title="Nenhuma ata ainda"
        description="Suas atas aparecem aqui depois da primeira conversa com o mentor no WhatsApp."
        action={
          <a href={wa} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-gradient-accent px-5 t-button text-on-accent shadow-sm">
            <MessageCircle className="size-5" /> Falar com o mentor
          </a>
        }
      />
    </div>
  );
}
