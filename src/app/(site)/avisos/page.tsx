import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnnouncementCard } from "@/components/avisos/AnnouncementCard";
import { getPublishedAnnouncements } from "@/lib/data";

export const metadata: Metadata = {
  title: "Avisos",
  description: "Cultos especiais, conferências e comunicados da Igreja Amor e Cuidado.",
  alternates: { canonical: "/avisos" },
};

// Conteúdo editado pelo painel admin precisa aparecer em tempo real.
export const dynamic = "force-dynamic";

export default async function AvisosPage() {
  const announcements = await getPublishedAnnouncements();

  return (
    <div>
      <PageHeader
        eyebrow="Programação"
        title="Avisos"
        description="Cultos especiais, conferências e comunicados da igreja."
      />

      <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 sm:pb-32">
        {announcements.length === 0 ? (
          <p className="border-t border-border-subtle pt-8 text-sm text-foreground-subtle">
            Nenhum aviso publicado no momento.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {announcements.map((announcement, index) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} featured={index === 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
