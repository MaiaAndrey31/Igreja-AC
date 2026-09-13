"use client";

import { useEffect, useRef } from "react";

interface HeroYoutubeBackgroundProps {
  youtubeId: string;
  focusY: number;
}

/**
 * Vídeo do YouTube como fundo do Hero — mesma ideia de HeroVideo.tsx (o
 * elemento de LCP é o gradiente estático; o iframe só recebe `src` após o
 * mount, em idle, pra nunca competir com o LCP nem causar CLS).
 *
 * `youtube-nocookie.com` (não `youtube.com`) evita cookies de rastreamento
 * até que alguém interaja com o player — coerente com o cuidado do projeto
 * com LGPD (ver Política de Privacidade).
 *
 * Sem controles de áudio aqui: ao contrário do vídeo enviado (elemento
 * <video> nativo, que dá pra mutar/desmutar via JS livremente), controlar um
 * embed do YouTube em runtime exige carregar a IFrame Player API e abrir um
 * canal postMessage — o vídeo de fundo aqui é sempre mudo, como a maioria dos
 * vídeos de fundo do mercado.
 *
 * Sem `object-fit` para iframes: a técnica padrão é escalar o iframe muito
 * além do container (proporção 16:9 fixa) e centralizar por cima do ponto de
 * foco — o mesmo papel que `object-position` cumpre para <video>/<img>.
 */
export function HeroYoutubeBackground({ youtubeId, focusY }: HeroYoutubeBackgroundProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const idle =
      "requestIdleCallback" in window ? window.requestIdleCallback : (cb: () => void) => setTimeout(cb, 200);
    const cancelIdle = "cancelIdleCallback" in window ? window.cancelIdleCallback : clearTimeout;

    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      loop: "1",
      playlist: youtubeId,
      controls: "0",
      showinfo: "0",
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
      iv_load_policy: "3",
      disablekb: "1",
    });

    const id = idle(() => {
      iframe.src = `https://www.youtube-nocookie.com/embed/${youtubeId}?${params.toString()}`;
    });

    return () => cancelIdle(id as never);
  }, [youtubeId]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <iframe
        ref={iframeRef}
        title=""
        allow="autoplay; encrypted-media"
        className="absolute h-[56.25vw] min-h-full w-[177.78vh] min-w-full border-0"
        style={{ top: `${focusY}%`, left: "50%", transform: `translate(-50%, -${focusY}%)` }}
      />
    </div>
  );
}
