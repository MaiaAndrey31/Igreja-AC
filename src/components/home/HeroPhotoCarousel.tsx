"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SLIDE_DURATION_MS = 7000;
const TRANSITION_MS = 1200;

/**
 * Fundo "Foto" do Hero — uma foto só fica estática; duas ou mais alternam em
 * crossfade, como um carrossel. Todas as fotos ficam empilhadas (`fill`,
 * absolutas) e só a opacidade muda — sem isso, trocar de `src` reiniciaria o
 * download da imagem a cada troca em vez de já estar pronta na tela.
 */
export function HeroPhotoCarousel({ photoUrls, focusY }: { photoUrls: string[]; focusY: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (photoUrls.length < 2) return;
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % photoUrls.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(id);
  }, [photoUrls.length]);

  return (
    <>
      {photoUrls.map((url, i) => (
        <Image
          key={url}
          src={url}
          alt=""
          fill
          priority={i === 0}
          sizes="100vw"
          className="object-cover"
          style={{
            objectPosition: `50% ${focusY}%`,
            opacity: i === index ? 1 : 0,
            transition: `opacity ${TRANSITION_MS}ms ease-in-out`,
          }}
        />
      ))}
    </>
  );
}
