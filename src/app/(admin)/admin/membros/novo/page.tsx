import { PageHeader } from "@/components/ui/primitives";
import { listTracksBasic } from "@/modules/members/queries";
import { MemberForm } from "../member-form";

export const metadata = { title: "Cadastrar membro" };

export default async function NovoMembroPage() {
  const tracks = await listTracksBasic();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader crumbs={[{ label: "Admin", href: "/admin" }, { label: "Membros", href: "/admin/membros" }, { label: "Cadastrar" }]} title="Cadastrar membro" />
      <MemberForm tracks={tracks} />
    </div>
  );
}
