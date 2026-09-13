import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { formatEventDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface AnnouncementCardData {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  instagramUrl?: string | null;
  category: string;
  startDate: Date;
}

// lucide-react não traz ícones de marca (removidos por questão de trademark) —
// glifo do Instagram desenhado à mão, mesmo peso visual dos ícones lucide ao redor (stroke-2).
function InstagramGlyph({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function AnnouncementCard({ announcement, featured = false }: { announcement: AnnouncementCardData; featured?: boolean }) {
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface",
        featured && "sm:col-span-2 sm:flex-row"
      )}
    >
      <div className={cn("relative aspect-[16/10] w-full overflow-hidden", featured && "sm:aspect-auto sm:w-2/5")}>
        {announcement.imageUrl ? (
          <Image
            src={announcement.imageUrl}
            alt={announcement.title}
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <MediaPlaceholder label="Substituir pela imagem do aviso" />
        )}

        {announcement.instagramUrl && (
          <a
            href={announcement.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver vídeo no Instagram"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/40 transition-transform hover:scale-110"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 opacity-75" />
            <InstagramGlyph size={16} className="relative" />
          </a>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-accent">
            <span>{announcement.category}</span>
            <span className="h-1 w-1 rounded-full bg-accent/60" />
            <span className="inline-flex items-center gap-1.5 text-foreground-subtle">
              <CalendarDays size={12} />
              {formatEventDate(announcement.startDate)}
            </span>
          </div>
          <h3 className="font-display mt-3 text-xl tracking-wide text-foreground">{announcement.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-foreground-subtle">{announcement.description}</p>
        </div>
      </div>
    </article>
  );
}
