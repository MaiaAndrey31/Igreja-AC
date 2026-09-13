"use client";

import { m } from "framer-motion";

/**
 * Reveal único do site: opacidade + 14px de deslocamento, uma vez só.
 *
 * Deliberadamente sem parallax pesado, stagger longo ou escala — o briefing
 * pede reveals discretos que nunca custem legibilidade. `MotionConfig
 * reducedMotion="user"` (ver MotionProvider) neutraliza o deslocamento quando
 * o visitante pede menos movimento; a opacidade continua.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </m.div>
  );
}
