import { ArrowUpRight } from "lucide-react";
import { unit } from "@/data/unit";
import { Reveal } from "@/components/ui/Reveal";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

/**
 * "Parte da família Amor e Cuidado" — contexto de pertencimento, não
 * protagonismo. A sede nacional (Araçatuba, 1936) só aparece para explicar de
 * onde vem o nome e por que Adamantina foi a primeira a segui-la — a seção é
 * deliberadamente curta e fica entre Ministérios e Quero Fazer Parte, nunca
 * abrindo a home.
 */
export function NetworkFamily() {
  return (
    <section className="on-paper">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <SectionEyebrow index={7}>Parte da família Amor e Cuidado</SectionEyebrow>

        <Reveal className="mt-10 grid gap-8 sm:grid-cols-12">
          <p className="font-display text-2xl uppercase leading-snug text-foreground sm:col-span-7 sm:text-4xl">
            “{unit.verse.excerpt}” — {unit.verse.reference}. {unit.verse.reading}
          </p>

          <div className="sm:col-span-4 sm:col-start-9">
            <p className="text-sm leading-relaxed text-foreground-muted">
              Somos a primeira extensão da rede nacional Amor e Cuidado, cuja sede fica em{" "}
              {unit.network.headquartersCity}/{unit.network.headquartersState}, desde {unit.network.foundedYear}.
              Abrimos caminho para as unidades que vieram depois de nós.
            </p>
            <a
              href={unit.network.site}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 border-b border-accent pb-1 text-[11px] uppercase tracking-[0.16em] text-accent transition-colors hover:border-foreground hover:text-foreground"
            >
              Conheça a rede Amor e Cuidado
              <ArrowUpRight size={14} />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
