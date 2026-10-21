import { BookOpen, ClipboardCheck, FileText, Home, LayoutDashboard, MessageCircle, Settings, Users, Video } from "lucide-react";

export const memberNav = [
  { href: "/app", label: "Início", icon: Home, exact: true },
  { href: "/app/aulas", label: "Aulas", icon: BookOpen },
  { href: "/app/mentorias", label: "Mentorias", icon: Video },
  { href: "/app/plano", label: "Plano", icon: ClipboardCheck },
  { href: "/app/atas", label: "Atas", icon: FileText },
] as const;

export const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/membros", label: "Membros", icon: Users },
  { href: "/admin/conteudos", label: "Conteúdos", icon: BookOpen },
  { href: "/admin/mentorias", label: "Mentorias", icon: Video },
  { href: "/admin/atas", label: "Atas e planos", icon: FileText },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

export { MessageCircle };
