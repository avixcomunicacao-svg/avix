import { eq } from "drizzle-orm";
import { requireMember } from "@/modules/auth/session";
import { db, schema } from "@/db";
import { fmtDate, fmtPhone } from "@/lib/format";
import { ProfileForm } from "./profile-form";
import { Card } from "@/components/ui/primitives";
import { signOut } from "@/modules/auth/actions";

export const metadata = { title: "Meu perfil" };

export default async function PerfilPage() {
  const { user, access } = await requireMember();
  const [profile, availability] = await Promise.all([
    db.query.memberProfiles.findFirst({ where: eq(schema.memberProfiles.userId, user.id), columns: { notesPrivate: false } }),
    db.query.memberAvailability.findFirst({ where: eq(schema.memberAvailability.memberId, user.id) }),
  ]);
  if (!profile) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="t-h1">Meu perfil</h1>
      <Card className="flex flex-col gap-1 bg-surface-100">
        <span className="t-label text-ink-muted">Acesso</span>
        <span className="t-body">
          {fmtDate(access.accessStart)} até {fmtDate(access.accessEnd)}
        </span>
        <span className="t-body-sm text-ink-muted">
          {user.email} · WhatsApp {fmtPhone(profile.whatsappE164)} — para alterar, fale com o mentor.
        </span>
      </Card>
      <ProfileForm
        initial={{
          name: user.name,
          goals: profile.goals ?? "",
          weekdays: availability?.weekdays ?? [1, 2, 3, 4, 5],
          hoursPerWeek: availability?.hoursPerWeek ?? 4,
          agendaTime: String(profile.agendaTime).slice(0, 5),
          agendaWhatsapp: profile.agendaChannels.whatsapp,
          agendaEmail: profile.agendaChannels.email,
        }}
      />
      <form action={signOut}>
        <button className="t-body-sm text-ink-muted underline-offset-2 hover:underline">Sair da conta</button>
      </form>
    </div>
  );
}
