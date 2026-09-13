import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles, Users, Megaphone, Images, Inbox } from "lucide-react";
import { getAdminCounts } from "@/lib/adminData";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Painel" };

export default async function AdminHomePage() {
  const counts = await getAdminCounts();

  const cards = [
    { label: "Ministérios", value: counts.ministries, href: "/admin/ministerios", icon: Sparkles },
    { label: "Células", value: counts.cells, href: "/admin/celulas", icon: Users },
    { label: "Avisos", value: counts.announcements, href: "/admin/avisos", icon: Megaphone },
    { label: "Fotos na galeria", value: counts.gallery, href: "/admin/galeria", icon: Images },
    {
      label: "Contatos não atendidos",
      value: counts.unreadSubmissions,
      href: "/admin/contatos",
      icon: Inbox,
      highlight: counts.unreadSubmissions > 0,
    },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl tracking-wide text-foreground">Painel</h1>
      <p className="mt-2 text-sm text-foreground-subtle">Visão geral do conteúdo publicado no site.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={cn(
              "rounded-2xl border bg-surface p-6 transition-colors hover:border-accent/40",
              card.highlight ? "border-accent/50" : "border-border-subtle"
            )}
          >
            <card.icon size={20} className="text-accent" />
            <p className="mt-4 text-3xl font-semibold text-foreground">{card.value}</p>
            <p className="mt-1 text-sm text-foreground-subtle">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
