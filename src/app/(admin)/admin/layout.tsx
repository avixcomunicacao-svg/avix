import { AdminShell } from "@/components/nav/admin-shell";
import { requireAdmin } from "@/modules/auth/session";
import { getSettings } from "@/modules/settings/queries";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([requireAdmin(), getSettings()]);
  return (
    <AdminShell user={{ name: user.name, avatarUrl: user.avatarUrl }} brandName={settings.brand.name}>
      {children}
    </AdminShell>
  );
}
