import { FileText } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/ui/primitives";

export const metadata = { title: "Atas e planos" };

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader crumbs={[{ label: "Admin", href: "/admin" }, { label: "Atas e planos" }]} title="Atas e planos" />
      <EmptyState icon={<FileText className="size-6" strokeWidth={1.75} />} title="Atas e planos" description="Atas de WhatsApp e resumos de mentorias gerados pela IA, com a fila de revisão quando a aprovação estiver ligada. Entra nas fases 4 e 5." />
    </div>
  );
}
