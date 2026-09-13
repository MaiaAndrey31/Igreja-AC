import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { cellCities } from "@/data/cellCities";
import { unit, whatsappUrl } from "@/data/unit";
import { Reveal } from "@/components/ui/Reveal";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

/**
 * "Encontre uma célula" — modelo declarado da igreja: "tudo acontece através
 * delas". Mostra o alcance real (as 6 cidades da microrregião, fonte: página
 * oficial da unidade) e manda para /celulas, onde a lista de verdade (vinda
 * do painel admin) pode ser filtrada por bairro/cidade.
 */
export function CellReach() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <SectionEyebrow index={3}>Encontre uma célula</SectionEyebrow>

        <div className="mt-12 grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <h2 className="font-display text-[clamp(2.25rem,7vw,5rem)] uppercase text-foreground">
              Igreja também acontece numa sala de estar.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground-muted">
              A Amor e Cuidado é {unit.model.title.toLowerCase()}. {unit.model.description} Com{" "}
              {unit.cellsCount} células espalhadas por {cellCities.length} cidades da região, é bem provável
              que exista uma perto de você.
            </p>

            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Cidades alcançadas pelas células">
              {cellCities.map((city) => (
                <li
                  key={city}
                  className="font-data border border-border-soft px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-foreground-muted"
                >
                  {city}
                </li>
              ))}
            </ul>
          </Reveal>

          <div className="flex flex-col justify-end gap-3 sm:flex-row lg:col-span-4 lg:col-start-9 lg:flex-col">
            <Link
              href="/celulas"
              className="inline-flex items-center justify-center gap-2 bg-accent px-6 py-3.5 text-[11px] uppercase tracking-[0.18em] text-accent-contrast transition-opacity hover:opacity-85"
            >
              Encontrar uma célula
              <ArrowRight size={14} />
            </Link>
            <a
              href={whatsappUrl(`Olá! Vim pelo site da ${unit.shortName} e gostaria de entrar em uma célula.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-border-soft px-6 py-3.5 text-[11px] uppercase tracking-[0.18em] text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              <MessageCircle size={14} />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
