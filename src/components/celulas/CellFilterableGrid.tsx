"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CellCard, type CellCardData } from "@/components/celulas/CellCard";
import { cn } from "@/lib/utils";

export function CellFilterableGrid({ cells, unitName }: { cells: CellCardData[]; unitName: string }) {
  const neighborhoods = useMemo(
    () => Array.from(new Set(cells.map((cell) => cell.neighborhood))).sort(),
    [cells]
  );
  const [selected, setSelected] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const filtered = selected ? cells.filter((cell) => cell.neighborhood === selected) : cells;

  function scrollByCard(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * 330, behavior: "smooth" });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors",
              selected === null ? "border-accent text-accent" : "border-border-soft text-foreground-subtle hover:text-foreground"
            )}
          >
            Todas as regiões
          </button>
          {neighborhoods.map((neighborhood) => (
            <button
              key={neighborhood}
              type="button"
              onClick={() => setSelected(neighborhood)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors",
                selected === neighborhood
                  ? "border-accent text-accent"
                  : "border-border-soft text-foreground-subtle hover:text-foreground"
              )}
            >
              {neighborhood}
            </button>
          ))}
        </div>

        {filtered.length > 0 && (
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => scrollByCard(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border-soft text-foreground-muted transition-colors hover:border-accent hover:text-accent"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Próximo"
              onClick={() => scrollByCard(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border-soft text-foreground-muted transition-colors hover:border-accent hover:text-accent"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-12 text-center text-sm text-foreground-subtle">Nenhuma célula encontrada nessa região.</p>
      ) : (
        <div
          ref={trackRef}
          className="mt-10 flex gap-5 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {filtered.map((cell) => (
            <div key={cell.id} className="snap-start">
              <CellCard cell={cell} unitName={unitName} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
