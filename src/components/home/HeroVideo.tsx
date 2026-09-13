"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface HeroVideoProps {
  src: string;
  poster: string;
  focusY: number;
}

/**
 * O elemento de LCP do Hero é o gradiente estático (renderiza sem depender de
 * rede). O vídeo só recebe `src` após o mount e some/entra em fade quando
 * está pronto para tocar — assim ele nunca compete com o LCP nem causa CLS.
 *
 * focusY: ponto vertical de foco do object-cover, configurável em
 * /admin/configuracoes — evita cortar o assunto principal do vídeo/foto
 * quando a proporção não bate com a área do Hero.
 *
 * Autoplay com som é bloqueado pelos navegadores sem gesto do usuário — o
 * vídeo começa mudo e o botão permite ativar o áudio manualmente.
 */
export function HeroVideo({ src, poster, focusY }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const idle = "requestIdleCallback" in window ? window.requestIdleCallback : (cb: () => void) => setTimeout(cb, 200);
    const cancelIdle = "cancelIdleCallback" in window ? window.cancelIdleCallback : clearTimeout;

    const id = idle(() => {
      video.src = src;
      video.load();
      video.play().catch(() => {
        /* autoplay pode ser bloqueado até haver interação — segue mudo, sem quebrar a página */
      });
    });

    return () => cancelIdle(id as never);
  }, [src]);

  function toggleMuted() {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    if (!next) video.play().catch(() => {});
    setMuted(next);
  }

  return (
    <>
      <video
        ref={videoRef}
        muted={muted}
        loop
        playsInline
        preload="none"
        poster={poster}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: `50% ${focusY}%` }}
      />
      {/* top-24: abaixo do header fixo (z-50) e longe do banner de cookies fixo na base — evita ambos sobrepondo o botão */}
      <button
        type="button"
        onClick={toggleMuted}
        aria-label={muted ? "Ativar som do vídeo" : "Silenciar vídeo"}
        className="absolute right-5 top-24 z-10 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:right-8"
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </>
  );
}
