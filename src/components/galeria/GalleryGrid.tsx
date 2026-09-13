"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";

export interface GalleryImageData {
  id: string;
  url: string;
  alt: string;
  eventName: string | null;
}

export function GalleryGrid({ images }: { images: GalleryImageData[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const goTo = useCallback(
    (delta: number) => {
      setActiveIndex((current) => {
        if (current === null) return current;
        return (current + delta + images.length) % images.length;
      });
    },
    [images.length]
  );

  function scrollByCard(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * 280, behavior: "smooth" });
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (activeIndex !== null && !dialog.open) dialog.showModal();
    if (activeIndex === null && dialog.open) dialog.close();
  }, [activeIndex]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (activeIndex === null) return;
      if (e.key === "ArrowRight") goTo(1);
      if (e.key === "ArrowLeft") goTo(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, goTo]);

  const active = activeIndex !== null ? images[activeIndex] : null;

  return (
    <>
      {images.length > 1 && (
        <div className="mb-4 hidden justify-end gap-2 sm:flex">
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

      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group relative aspect-square w-[46vw] shrink-0 snap-start overflow-hidden rounded-xl border border-border-subtle bg-surface sm:w-56"
          >
            {image.url ? (
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="(max-width: 640px) 46vw, 224px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <MediaPlaceholder label={image.eventName ?? "Substituir pela foto real"} />
            )}
          </button>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        onClose={close}
        onCancel={close}
        className="m-auto w-[94vw] max-w-4xl bg-transparent p-0 backdrop:bg-black/85 backdrop:backdrop-blur-sm"
      >
        {active && (
          <div className="relative flex flex-col items-center">
            <button
              type="button"
              onClick={close}
              aria-label="Fechar"
              className="absolute -top-12 right-0 rounded-full p-2 text-foreground-muted hover:text-foreground"
            >
              <X size={22} />
            </button>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface">
              {active.url ? (
                <Image src={active.url} alt={active.alt} fill sizes="90vw" className="object-contain" />
              ) : (
                <MediaPlaceholder label={active.eventName ?? "Substituir pela foto real"} />
              )}
            </div>
            <p className="mt-4 text-center text-sm text-foreground-subtle">{active.eventName ?? active.alt}</p>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goTo(-1)}
                  aria-label="Anterior"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-2 text-foreground hover:bg-background/90"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(1)}
                  aria-label="Próxima"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-2 text-foreground hover:bg-background/90"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
