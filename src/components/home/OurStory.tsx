import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import type { UnitInfo } from "@/lib/firebase/collections";

/**
 * "Nossa história" — a narrativa mais forte que esta unidade tem: de uma
 * garagem, em 2013, a um templo próprio, em 2024. É a seção que segura a
 * home, então não esconde nem resume demais.
 *
 * Cada frase vem de `unit.originStory`/`unit.newTempleStory`, editáveis em
 * /admin/unidade — fatos verificados (Instagram, Facebook, matéria da Folha
 * Regional sobre a inauguração). Não acrescente detalhe sem fonte.
 */
export function OurStory({ unit }: { unit: UnitInfo }) {
  return (
    <section className="on-paper">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <SectionEyebrow index={1} verseReference={unit.verseReference}>
          Nossa história
        </SectionEyebrow>

        <Reveal className="mt-14 grid gap-10 sm:grid-cols-12">
          <div className="sm:col-span-8">
            <h2 className="font-display text-[clamp(2.5rem,8vw,6rem)] uppercase text-foreground">
              De uma garagem a um templo próprio, numa década.
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-px bg-border-subtle sm:grid-cols-12">
          <div className="flex flex-col justify-center gap-4 bg-background p-8 sm:col-span-6 sm:p-12">
            <p className="font-data text-[11px] uppercase tracking-[0.2em] text-accent">
              2013 — {unit.foundedDateLabel}
            </p>
            <p className="text-base leading-relaxed text-foreground-muted">{unit.originStory}</p>
          </div>

          <div className="flex flex-col justify-center gap-4 bg-background p-8 sm:col-span-6 sm:p-12">
            <p className="font-data text-[11px] uppercase tracking-[0.2em] text-accent">
              {unit.newTempleYear}
            </p>
            <p className="text-base leading-relaxed text-foreground-muted">{unit.newTempleStory}</p>
          </div>
        </div>

        {/* Fotos reais enviadas pela igreja: o templo (fachada aérea, Parque
            do Sol) e a mesa da Santa Ceia — o prédio e a prática, lado a lado. */}
        <div className="mt-px grid grid-cols-1 gap-px bg-border-subtle sm:grid-cols-12">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-2 sm:col-span-8">
            <Image
              src="/assets/building/fachada-aerea.jpg"
              alt="Vista aérea do templo da Amor e Cuidado Adamantina, no Parque do Sol"
              fill
              loading="lazy"
              sizes="(max-width: 640px) 100vw, 66vw"
              className="object-cover"
            />
          </div>
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-2 sm:col-span-4">
            <Image
              src="/assets/gallery/santa-ceia.jpg"
              alt="Mesa da Santa Ceia, com pão, vinho e uma cruz ao fundo"
              fill
              loading="lazy"
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
