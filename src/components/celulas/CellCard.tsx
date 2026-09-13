import Image from "next/image";
import { MapPin, Clock, MessageCircle } from "lucide-react";
import { formatWhatsappLink } from "@/lib/format";

export interface CellCardData {
  id: string;
  name: string;
  leaderName: string;
  neighborhood: string;
  address: string;
  dayTime: string;
  whatsapp: string;
  logoUrl?: string | null;
}

export function CellCard({ cell, unitName }: { cell: CellCardData; unitName: string }) {
  return (
    <article className="flex min-h-[360px] w-[290px] shrink-0 overflow-hidden rounded-3xl border border-border-subtle bg-surface shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:w-[330px]">
      <div className="flex w-full">
        <div className="relative w-1/2 overflow-hidden border-r border-border-subtle bg-surface-2/60">
          {cell.logoUrl ? (
            <Image
              src={cell.logoUrl}
              alt={`Logo da célula ${cell.name}`}
              width={180}
              height={220}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[220px] w-full items-center justify-center text-lg font-semibold text-accent">
              {cell.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex w-1/2 flex-col justify-between p-4">
          <div>
            <span className="inline-block rounded-full border border-border-soft px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-accent">
              {cell.neighborhood}
            </span>
            <h3 className="font-display mt-3 text-base tracking-wide text-foreground">{cell.name}</h3>
            <p className="mt-1 text-xs text-foreground-subtle">Líder: {cell.leaderName}</p>

            <div className="mt-3 flex flex-col gap-2 text-xs text-foreground-muted">
              <span className="inline-flex items-center gap-2">
                <Clock size={12} className="text-foreground-subtle" />
                {cell.dayTime}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin size={12} className="text-foreground-subtle" />
                {cell.address}
              </span>
            </div>
          </div>

          <a
            href={formatWhatsappLink(
              cell.whatsapp,
              `Olá ${cell.leaderName}, vi a célula ${cell.name} no site da ${unitName} e gostaria de saber mais.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-border-soft py-2 text-[10px] uppercase tracking-[0.15em] text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <MessageCircle size={12} />
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}
