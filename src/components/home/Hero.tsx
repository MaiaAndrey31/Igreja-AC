import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import { HeroVideo } from "@/components/home/HeroVideo";
import { HeroYoutubeBackground } from "@/components/home/HeroYoutubeBackground";
import { HeroPhotoCarousel } from "@/components/home/HeroPhotoCarousel";
import { mapsUrl } from "@/lib/site";
import { hasRealMedia } from "@/lib/heroCopy";
import type { UnitInfo } from "@/lib/firebase/collections";

interface HeroProps {
  unit: UnitInfo;
  title: string;
  subtitle: string;
  mediaType: "video" | "image";
  videoSource: "upload" | "youtube";
  videoUrl: string;
  youtubeId: string;
  posterUrls: string[];
  focusY: number;
}

export function Hero({
  unit,
  title,
  subtitle,
  mediaType,
  videoSource,
  videoUrl,
  youtubeId,
  posterUrls,
  focusY,
}: HeroProps) {
  const showYoutube = mediaType === "video" && videoSource === "youtube" && Boolean(youtubeId);
  const showUploadedVideo = mediaType === "video" && videoSource === "upload" && hasRealMedia(videoUrl);
  const showPhotos = mediaType === "image" && posterUrls.length > 0;
  // Enquanto a igreja não sobe vídeo/foto pelo painel, o fallback já é uma
  // foto real de culto (enviada pela própria igreja) — nunca banco de
  // imagens. É o elemento de LCP quando nada foi configurado, por isso
  // carrega com `priority`.
  const showFallbackPhoto = !showYoutube && !showUploadedVideo && !showPhotos;
  // A primeira foto do carrossel também serve de poster (frame de espera
  // enquanto o vídeo enviado carrega) — não existe mais um campo de foto
  // única separado para isso.
  const videoPosterUrl = posterUrls[0] ?? "";

  return (
    <section className="relative flex min-h-[640px] w-full items-end overflow-hidden bg-ink" style={{ height: "100svh" }}>
      {/* Camada estática de base — sempre presente, garante contraste para o
          texto mesmo antes de qualquer imagem carregar. */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #14120F 0%, #1B1814 55%, #14120F 100%)",
        }}
      />

      {showFallbackPhoto && (
        <Image
          src="/assets/gallery/culto-pregacao.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "50% 30%" }}
        />
      )}
      {showPhotos && <HeroPhotoCarousel photoUrls={posterUrls} focusY={focusY} />}
      {showUploadedVideo && <HeroVideo src={videoUrl} poster={videoPosterUrl} focusY={focusY} />}
      {showYoutube && <HeroYoutubeBackground youtubeId={youtubeId} focusY={focusY} />}

      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/25" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 pt-32 sm:px-8 sm:pb-24">
        <p className="font-data text-[11px] uppercase tracking-[0.24em] text-accent">{unit.tagline}</p>

        <h1 className="font-display mt-5 max-w-5xl text-[clamp(3rem,13vw,9rem)] uppercase text-paper">
          {title}
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-snug text-paper/85 sm:text-2xl">{subtitle}</p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Link
            href="/celulas"
            className="inline-flex items-center justify-center gap-2 bg-paper px-7 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-ink transition-opacity hover:opacity-85"
          >
            Encontre uma célula
            <ArrowRight size={15} />
          </Link>
          <a
            href={mapsUrl(unit.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-paper/30 px-7 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:border-paper hover:bg-paper/10"
          >
            <MapPin size={15} />
            Venha nos visitar
          </a>
        </div>
      </div>
    </section>
  );
}
