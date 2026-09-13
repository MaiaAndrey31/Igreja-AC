"use client";

import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";

/**
 * Carrega apenas o subconjunto `domAnimation` do Framer Motion (em vez do
 * pacote completo), reduzindo o JS enviado ao cliente. Componentes usam `m.*`
 * em vez de `motion.*` para se beneficiar deste bundle reduzido.
 *
 * `reducedMotion="user"` respeita `prefers-reduced-motion` em toda animação
 * do Framer Motion — o reveal ainda acontece (opacidade), mas sem
 * deslocamento. O CSS puro é coberto pela media query em globals.css.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>{children}</LazyMotion>
    </MotionConfig>
  );
}
