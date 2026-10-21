import { Video } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/ui/primitives";

export const metadata = { title: "Mentorias" };

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader crumbs={[{ label: "Admin", href: "/admin" }, { label: "Mentorias" }]} title="Mentorias" />
      <EmptyState icon={<Video className="size-6" strokeWidth={1.75} />} title="Mentorias" description="Agende mentorias individuais e em grupo. Ao salvar, o evento vai para o Google Calendar com link do Meet e a gravação entra no pipeline automaticamente. Entra na fase 3 — Google Calendar, Meet e Drive." />
    </div>
  );
}
