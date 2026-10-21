import { MemberShell } from "@/components/nav/member-shell";
import { requireMember } from "@/modules/auth/session";
import { getSettings } from "@/modules/settings/queries";
import { touchLastSeen } from "@/modules/members/queries";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const [{ user }, settings] = await Promise.all([requireMember(), getSettings()]);
  void touchLastSeen(user.id);
  return (
    <MemberShell user={{ name: user.name, avatarUrl: user.avatarUrl }} mentorWhatsapp={settings.mentorWhatsappE164} brandName={settings.brand.name}>
      {children}
    </MemberShell>
  );
}
