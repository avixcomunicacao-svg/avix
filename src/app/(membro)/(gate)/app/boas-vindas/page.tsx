import { redirect } from "next/navigation";
import { requireMember } from "@/modules/auth/session";
import { getSettings } from "@/modules/settings/queries";
import { OnboardingForm } from "./onboarding-form";
import { firstName } from "@/lib/format";

export default async function BoasVindasPage() {
  const [{ user, access }, settings] = await Promise.all([requireMember({ allowNoOnboarding: true }), getSettings()]);
  if (access.onboardingDone) redirect("/app");
  return (
    <main className="min-h-dvh bg-surface-000">
      <div className="mx-auto flex max-w-lg flex-col gap-8 px-4 py-10">
        <div>
          <span className="t-caption text-ink-faint">{settings.brand.name} · primeiro acesso</span>
          <h1 className="mt-2 t-display">Oi, {firstName(user.name)}.</h1>
          <p className="mt-3 t-body-lg text-ink-muted">Três perguntas rápidas para o seu plano de ação caber na sua rotina. Leva um minuto.</p>
        </div>
        <OnboardingForm brand={settings.brand.name} />
      </div>
    </main>
  );
}
