import { MessageCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { requireMember } from "@/modules/auth/session";
import { getSettings } from "@/modules/settings/queries";
import { fmtDate } from "@/lib/format";
import { signOut } from "@/modules/auth/actions";

export default async function RenovarPage() {
  const [{ user, access }, settings] = await Promise.all([requireMember({ allowInactive: true, allowNoOnboarding: true }), getSettings()]);
  if (access.isActive) redirect("/app");
  const wa = `https://wa.me/${settings.mentorWhatsappE164.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Sou ${user.name} e quero renovar meu acesso à ${settings.brand.name}.`)}`;
  const paused = access.status === "pausado";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface-000 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-brand p-6 text-on-brand">
          <span className="t-caption opacity-80">{settings.brand.name}</span>
          <h1 className="mt-2 t-h1">{paused ? "Seu acesso está pausado" : "Seu acesso terminou"}</h1>
          <p className="mt-3 t-body opacity-90">
            {paused
              ? "O mentor pausou seu acesso temporariamente. Fale com ele para reativar."
              : `Seu período foi de ${fmtDate(access.accessStart)} a ${fmtDate(access.accessEnd)}. Seu histórico, plano e atas continuam guardados — é só renovar para voltar.`}
          </p>
          <a
            href={wa}
            target="_blank"
            rel="noopener"
            className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-gradient-accent t-button text-on-accent"
          >
            <MessageCircle className="size-5" aria-hidden /> Falar com o mentor
          </a>
        </div>
        <form action={signOut} className="mt-4 text-center">
          <button className="t-body-sm text-ink-muted underline-offset-2 hover:underline">Sair da conta</button>
        </form>
      </div>
    </main>
  );
}
