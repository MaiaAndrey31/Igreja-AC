import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getPublishedEvents } from "@/lib/data";

export const metadata: Metadata = {
  title: "Eventos",
  description:
    "Confira os próximos eventos da Igreja Amor e Cuidado. Inscreva-se e participe de conferências, retiros, cultos especiais e muito mais.",
  alternates: { canonical: "/eventos" },
};

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function EventosPage() {
  const events = await getPublishedEvents();

  const now = new Date();
  const upcoming = events.filter((e) => e.startDate >= now);
  const past = events.filter((e) => e.startDate < now).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

  return (
    <div>
      <PageHeader
        eyebrow="Agenda"
        title="Próximos eventos"
        description="Participe dos eventos da Igreja Amor e Cuidado. Confira datas, locais e inscreva-se."
      />

      <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 sm:pb-32">
        {/* Próximos eventos */}
        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <Link
                key={event.id}
                href={event.slug ? `/eventos/${event.slug}` : "#"}
                className={`group flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface transition-all hover:border-accent/50 hover:shadow-md ${
                  !event.slug ? "pointer-events-none opacity-60" : ""
                }`}
              >
                {/* Imagem de capa */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-2">
                  {event.imageUrl ? (
                    <Image
                      src={event.imageUrl}
                      alt={event.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-foreground-subtle">
                      <Calendar size={32} />
                    </div>
                  )}
                  {/* Badge de categoria */}
                  <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-paper backdrop-blur-sm">
                    {event.category}
                  </span>
                </div>

                {/* Conteúdo */}
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <h3 className="font-display text-xl tracking-wide text-foreground group-hover:text-accent">
                    {event.title}
                  </h3>

                  <div className="flex flex-col gap-1.5 text-xs text-foreground-muted">
                    <span className="flex items-center gap-2">
                      <Calendar size={12} className="shrink-0 text-foreground-subtle" />
                      {formatDate(event.startDate)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock size={12} className="shrink-0 text-foreground-subtle" />
                      {formatTime(event.startDate)}
                    </span>
                    {event.address && (
                      <span className="flex items-center gap-2">
                        <MapPin size={12} className="shrink-0 text-foreground-subtle" />
                        {event.address}
                      </span>
                    )}
                  </div>

                  <p className="mt-auto line-clamp-2 text-sm text-foreground-muted">
                    {event.description}
                  </p>

                  <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.1em] text-accent">
                    Saiba mais <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-foreground-subtle">
            Nenhum evento programado no momento. Volte em breve!
          </div>
        )}

        {/* Eventos anteriores */}
        {past.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display mb-8 text-2xl tracking-wide text-foreground">
              Eventos anteriores
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {past.slice(0, 6).map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface p-5 opacity-70"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-subtle">
                    {event.category}
                  </span>
                  <h3 className="font-display text-lg tracking-wide text-foreground">
                    {event.title}
                  </h3>
                  <p className="text-xs text-foreground-muted">
                    {formatDate(event.startDate)} · {event.address ?? "Local não informado"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}