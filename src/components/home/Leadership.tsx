import Image from "next/image";
import { leaders } from "@/data/leaders";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";

/**
 * Liderança com tratamento humano — retrato real, nome em display, papel na
 * casa. Não é organograma nem página de funcionários, por isso só entram
 * aqui quem a igreja apresenta publicamente como liderança.
 *
 * 7 pessoas: grid 2 colunas no mobile, 3 no tablet, 4 no desktop — cartões
 * mais compactos que uma dupla em destaque pediria, já que agora é uma
 * equipe inteira, não dois nomes.
 */
export function Leadership() {
  return (
    <section className="on-paper">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <SectionEyebrow index={4}>Liderança</SectionEyebrow>

        <ul className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 sm:gap-x-8 lg:grid-cols-4">
          {leaders.map((leader) => (
            <li key={leader.slug}>
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-2">
                {leader.photoUrl ? (
                  <Image
                    src={leader.photoUrl}
                    alt={`Retrato de ${leader.name}`}
                    fill
                    loading="lazy"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <MediaPlaceholder label={`Retrato de ${leader.name} — a substituir`} />
                )}
              </div>

              <p className="font-data mt-4 text-[10px] uppercase leading-snug tracking-[0.14em] text-accent">
                {leader.role}
              </p>
              <h3 className="font-display mt-1.5 text-xl uppercase leading-tight text-foreground sm:text-2xl">
                {leader.name}
              </h3>

              {leader.quote && (
                <blockquote className="mt-3 border-l border-accent pl-4 text-sm leading-relaxed text-foreground-muted">
                  “{leader.quote}”
                </blockquote>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
