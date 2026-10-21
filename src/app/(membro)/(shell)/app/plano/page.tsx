import { ClipboardCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";
import { requireMember } from "@/modules/auth/session";

export const metadata = { title: "Plano de ação" };

export default async function PlanoPage() {
  await requireMember();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="t-h1">Plano de ação</h1>
      <div className="flex gap-1 rounded-full bg-surface-100 p-1 self-start" role="tablist" aria-label="Visão">
        {["Hoje", "Lista", "Semana", "Mês"].map((l, i) => (
          <span key={l} role="tab" aria-selected={i === 0} className={`min-h-9 rounded-full px-4 py-2 t-label ${i === 0 ? "bg-ink text-surface-000" : "text-ink-faint"}`}>
            {l}
          </span>
        ))}
      </div>
      <EmptyState
        icon={<ClipboardCheck className="size-6" strokeWidth={1.75} />}
        title="Seu plano ainda está vazio"
        description="Depois da primeira mentoria individual ou conversa com o mentor no WhatsApp, as orientações viram ações aqui — com passo a passo, tempo estimado e o dia certo para fazer, dentro das horas que você definiu."
      />
    </div>
  );
}
