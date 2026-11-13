import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import type { Announcement } from "@/lib/firebase/collections";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

interface FeaturedEventsProps {
  events: Announcement[];
}

/**
 * Seção editorial de eventos em destaque na home.
 * Exibe apenas eventos publicados com `featured === true`.
 * Quando o array está vazio, a seção não renderiza nada.
 */
export function FeaturedEvents({ events }: FeaturedEventsProps) {
  if (events.length === 0) return null;

  return (
    <section className="on-paper bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Cabeçalho da seção */}
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Agenda
            </p>
            <h2 className="font-display mt-2 text-[clamp(1.75rem,4vw,3rem)] uppercase leading-[0.95] text-ink">
              Próximos eventos
            </h2>
          </div>
          <Link
            href="/eventos"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-ink transition-colors hover:text-accent"
          >
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>

        {/* Grid de eventos */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={event.slug ? `/eventos/${event.slug}` : "#"}
              className={`group flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface transition-all hover:border-accent/50 hover:shadow-md ${
                !event.slug ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {/* Imagem */}
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
                <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-paper backdrop-blur-sm">
                  {event.category}
                </span>
              </div>

              {/* Conteúdo */}
              <div className="flex flex-1 flex-col gap-3 p-5">
                <h3 className="font-display text-xl tracking-wide text-ink group-hover:text-accent">
                  {event.title}
                </h3>

                <div className="flex flex-col gap-1.5 text-xs text-foreground-muted">
                  <span className="flex items-center gap-2">
                    <Calendar size={12} className="shrink-0 text-foreground-subtle" />
                    {formatDate(event.startDate)}
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
      </div>
    </section>
  );
}