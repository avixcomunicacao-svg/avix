import { Video } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";
import { requireMember } from "@/modules/auth/session";

export const metadata = { title: "Mentorias" };

export default async function MentoriasPage(props: { searchParams: Promise<{ aba?: string }> }) {
  await requireMember();
  const { aba } = await props.searchParams;
  const tab = aba === "minhas" ? "minhas" : "grupo";
  return (
    <div className="flex flex-col gap-6">
      <h1 className="t-h1">Mentorias</h1>
      <div className="flex gap-1 rounded-full bg-surface-100 p-1 self-start" role="tablist">
        {[
          { k: "grupo", l: "Em grupo" },
          { k: "minhas", l: "Minhas mentorias" },
        ].map((t) => (
          <a key={t.k} href={`?aba=${t.k}`} role="tab" aria-selected={tab === t.k} className={`min-h-9 rounded-full px-4 py-2 t-label ${tab === t.k ? "bg-ink text-surface-000" : "text-ink-muted"}`}>
            {t.l}
          </a>
        ))}
      </div>
      {tab === "grupo" ? (
        <EmptyState
          icon={<Video className="size-6" strokeWidth={1.75} />}
          title="Nenhuma mentoria em grupo ainda"
          description="Quando o mentor agendar uma mentoria da sua trilha, ela aparece aqui com o link do Meet. Depois, a gravação, o resumo e a transcrição ficam disponíveis neste mesmo lugar."
        />
      ) : (
        <EmptyState
          icon={<Video className="size-6" strokeWidth={1.75} />}
          title="Suas mentorias individuais aparecem aqui"
          description="Gravação, transcrição com busca, resumo e o plano de ação gerado — só seus, ninguém mais vê."
        />
      )}
    </div>
  );
}
