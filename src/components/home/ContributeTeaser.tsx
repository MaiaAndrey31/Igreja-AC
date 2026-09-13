import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

/**
 * Contribuição — sóbrio de propósito.
 *
 * Nenhum dado financeiro aparece na home: chave Pix e conta ficam na página
 * /contribua, onde há espaço para o aviso de conferência dos dados. Aqui só o
 * convite.
 */
export function ContributeTeaser() {
  return (
    <section className="on-paper">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <SectionEyebrow index={9}>Contribua</SectionEyebrow>

        <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <p className="font-display max-w-2xl text-[clamp(2rem,6vw,4rem)] uppercase text-foreground">
            Sua contribuição sustenta o cuidado.
          </p>

          <Link
            href="/contribua"
            className="inline-flex shrink-0 items-center justify-center gap-2 border border-accent px-7 py-4 text-[11px] uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent hover:text-accent-contrast"
          >
            Como contribuir
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
