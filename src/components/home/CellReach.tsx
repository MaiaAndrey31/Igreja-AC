import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/site";
import { Reveal } from "@/components/ui/Reveal";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { ContactFormTrigger } from "@/components/site/ContactFormTrigger";
import type { Cell, UnitInfo } from "@/lib/firebase/collections";

/**
 * "Encontre uma célula" — modelo declarado da igreja: "tudo acontece através
 * delas". A unidade atua só em Adamantina (não numa microrregião), então o
 * alcance mostrado aqui são os bairros com célula cadastrada em
 * /admin/celulas — não uma lista de cidades.
 */
export function CellReach({ unit, cells }: { unit: UnitInfo; cells: Cell[] }) {
  const neighborhoods = Array.from(new Set(cells.map((cell) => cell.neighborhood))).sort();

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <SectionEyebrow index={3} verseReference={unit.verseReference}>
          Encontre uma célula
        </SectionEyebrow>

        <div className="mt-12 grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <h2 className="font-display text-[clamp(2.25rem,7vw,5rem)] uppercase text-foreground">
              Igreja também acontece numa sala de estar.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground-muted">
              A Amor e Cuidado é {unit.modelTitle.toLowerCase()}. {unit.modelDescription} Com{" "}
              {unit.cellsCountLabel} células espalhadas pelos bairros de {unit.city}, é bem provável que
              exista uma perto de você.
            </p>

            {neighborhoods.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-2" aria-label="Bairros com célula cadastrada">
                {neighborhoods.map((neighborhood) => (
                  <li
                    key={neighborhood}
                    className="font-data border border-border-soft px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-foreground-muted"
                  >
                    {neighborhood}
                  </li>
                ))}
              </ul>
            )}
          </Reveal>

          <div className="flex flex-col justify-end gap-3 sm:flex-row lg:col-span-4 lg:col-start-9 lg:flex-col">
            <Link
              href="/celulas"
              className="inline-flex items-center justify-center gap-2 bg-accent px-6 py-3.5 text-[11px] uppercase tracking-[0.18em] text-accent-contrast transition-opacity hover:opacity-85"
            >
              Encontrar uma célula
              <ArrowRight size={14} />
            </Link>
            <ContactFormTrigger
              type="celula"
              modalTitle="Quero uma célula"
              modalDescription="Deixe seu contato que alguém te apresenta a célula mais perto de você."
              whatsappHref={whatsappUrl(
                unit.contactPhoneE164,
                `Olá! Vim pelo site da ${unit.shortName} e gostaria de entrar em uma célula.`
              )}
              className="inline-flex items-center justify-center gap-2 border border-border-soft px-6 py-3.5 text-[11px] uppercase tracking-[0.18em] text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              <MessageCircle size={14} />
              Falar com a gente
            </ContactFormTrigger>
          </div>
        </div>
      </div>
    </section>
  );
}
