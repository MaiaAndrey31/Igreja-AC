import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { mapsUrl } from "@/lib/site";
import {
  WEEKDAY_LABELS,
  groupServicesByWeekday,
  partitionServices,
  filterFutureOneTimeServices,
  sortOneTimeServices,
} from "@/lib/services";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pending } from "@/components/ui/Pending";
import { getActiveCells, getPublishedLeaders, getServices, getUnitInfo } from "@/lib/data";

export const metadata: Metadata = {
  title: "Nossa história",
  description:
    "De uma garagem a um templo, nosso Deus é Deus de milagres! Conheça a trajetória da Igreja Amor e Cuidado em Adamantina.",
  alternates: { canonical: "/sobre" },
};

/**
 * Página institucional escrita de forma editorial e curada — nada copiado em
 * bloco de material de terceiros. Cada afirmação vem do que a igreja mantém
 * em /admin/unidade e /admin/lideranca — fato verificado publicamente, nunca
 * inferido.
 */
export default async function SobrePage() {
  const [unit, leaders, cells, services] = await Promise.all([
    getUnitInfo(),
    getPublishedLeaders(),
    getActiveCells(),
    getServices(),
  ]);
  const { weekly, oneTime } = partitionServices(services);
  const week = groupServicesByWeekday(weekly);
  // Acontecimentos únicos futuros (server-side usa Date.now() como referência).
  const futureOneTime = sortOneTimeServices(filterFutureOneTimeServices(oneTime, new Date()));
  const neighborhoods = Array.from(new Set(cells.map((cell) => cell.neighborhood))).sort();

  return (
    <div>
      <PageHeader
        eyebrow="Quem somos"
        title={unit.name}
        description={`Fundada oficialmente em ${unit.foundedDateLabel}, com ${unit.foundingMembers} pessoas. O nome não veio de um estúdio de marca — veio de ${unit.verseReference}.`}
        meta={
          <>
            Congregação desde {unit.foundedYear} · {unit.city}/{unit.state}
            <br />
            {unit.cellsCountLabel} células pelos bairros de {unit.city}
          </>
        }
      />

      <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 sm:pb-32">
        {/* Origem do nome */}
        <section className="grid gap-8 border-t border-border-subtle py-14 sm:grid-cols-12 sm:py-20">
          <p className="font-data text-[11px] uppercase tracking-[0.2em] text-accent sm:col-span-3">
            {unit.verseReference}
          </p>
          <div className="sm:col-span-8">
            <p className="font-display text-[clamp(2rem,6vw,4rem)] uppercase text-foreground">
              “{unit.verseExcerpt}”
            </p>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground-muted">
              Foi o que Jesus disse a Pedro. {unit.verseReading} É nessa ordem que a igreja lê o próprio
              nome — e é nessa ordem que ela tenta funcionar.
            </p>
          </div>
        </section>

        {/* História: garagem → congregação → templo novo */}
        <section className="grid gap-8 border-t border-border-subtle py-14 sm:grid-cols-12 sm:py-20">
          <p className="font-data text-[11px] uppercase tracking-[0.2em] text-accent sm:col-span-3">
            Nossa história
          </p>
          <div className="sm:col-span-8">
            <h2 className="font-display mb-6 text-[clamp(1.75rem,4vw,3rem)] uppercase leading-[0.95] text-foreground">
              De uma garagem a um templo, nosso Deus é Deus de milagres!
            </h2>
            <p className="text-lg leading-relaxed text-foreground-muted">{unit.originStory}</p>
            <p className="mt-5 text-base leading-relaxed text-foreground-subtle">{unit.newTempleStory}</p>

            <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden border border-border-subtle">
              <Image
                src="/assets/building/fachada-aerea.jpg"
                alt="Vista aérea do templo da Amor e Cuidado Adamantina, no Parque do Sol"
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* Modelo de células */}
        <section className="grid gap-8 border-t border-border-subtle py-14 sm:grid-cols-12 sm:py-20">
          <p className="font-data text-[11px] uppercase tracking-[0.2em] text-accent sm:col-span-3">
            Como funciona
          </p>
          <div className="sm:col-span-8">
            <h2 className="font-display text-4xl uppercase text-foreground sm:text-5xl">{unit.modelTitle}</h2>
            <p className="mt-5 text-base leading-relaxed text-foreground-muted">
              {unit.modelDescription} O domingo reúne; a semana é onde a igreja acontece, pelos bairros de{" "}
              {unit.city}
              {neighborhoods.length > 0 ? ` (${neighborhoods.length} hoje cadastrados)` : ""}.{" "}
              <Link href="/celulas" className="underline decoration-accent/50 underline-offset-4 hover:text-accent">
                Veja as células
              </Link>
              .
            </p>

            <p className="mt-12 text-[11px] uppercase tracking-[0.22em] text-foreground-subtle">
              Parte da rede Amor e Cuidado
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-foreground-muted">
              Somos a primeira extensão da rede nacional Amor e Cuidado, cuja sede fica em{" "}
              {unit.networkHeadquartersCity}/{unit.networkHeadquartersState}, desde {unit.networkFoundedYear}.
              Abrimos caminho para as unidades que vieram depois de nós.{" "}
              <a
                href={unit.networkSite}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-accent/50 underline-offset-4 hover:text-accent"
              >
                Conheça a rede
              </a>
              .
            </p>
          </div>
        </section>

        {/* Liderança */}
        <section className="grid gap-8 border-t border-border-subtle py-14 sm:grid-cols-12 sm:py-20">
          <p className="font-data text-[11px] uppercase tracking-[0.2em] text-accent sm:col-span-3">
            Liderança
          </p>
          <ul className="sm:col-span-8">
            {leaders.map((leader) => (
              <li key={leader.id} className="border-b border-border-subtle pb-6 last:border-0 [&+li]:pt-6">
                <p className="font-data text-[11px] uppercase tracking-[0.16em] text-accent">{leader.role}</p>
                <p className="font-display mt-2 text-3xl uppercase text-foreground sm:text-4xl">
                  {leader.name}
                </p>
                {leader.quote && (
                  <p className="mt-3 max-w-xl text-base leading-relaxed text-foreground-muted">
                    “{leader.quote}”
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* O que cremos — sem fonte pública para uma declaração de fé própria */}
        <section className="grid gap-8 border-t border-border-subtle py-14 sm:grid-cols-12 sm:py-20">
          <p className="font-data text-[11px] uppercase tracking-[0.2em] text-accent sm:col-span-3">
            O que cremos
          </p>
          <div className="sm:col-span-8">
            <Pending label="declaração de fé" />
            <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground-subtle">
              A declaração de fé da Amor e Cuidado ainda não foi publicada em fonte oficial. Assim que a igreja
              enviar o texto, ele entra aqui — não reproduzimos texto de terceiros no lugar dele.
            </p>
          </div>
        </section>

        {/* Visite / contato */}
        <section className="grid gap-8 border-t border-border-subtle py-14 sm:grid-cols-12 sm:py-20">
          <p className="font-data text-[11px] uppercase tracking-[0.2em] text-accent sm:col-span-3">
            Venha nos visitar
          </p>

          <div className="sm:col-span-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-foreground-subtle">Celebrações</p>
            <dl className="mt-4">
              {week.map(({ weekday, services }) => (
                <div
                  key={weekday}
                  className="flex items-baseline justify-between gap-4 border-t border-border-subtle py-3 text-sm"
                >
                  <dt className="text-foreground-subtle">
                    {WEEKDAY_LABELS[weekday]}
                    {services[0]?.label && (
                      <span className="ml-2 text-[10px] uppercase tracking-[0.14em] text-accent">
                        {services[0].label}
                      </span>
                    )}
                  </dt>
                  <dd className="font-data flex flex-wrap justify-end gap-x-3 text-foreground">
                    {services.map((service) => (
                      <span key={`${service.weekday}-${service.time}`}>{service.time}</span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>

            {futureOneTime.length > 0 && (
              <>
                <p className="mt-6 text-[11px] uppercase tracking-[0.22em] text-foreground-subtle">
                  Programação especial
                </p>
                <dl className="mt-4">
                  {futureOneTime.map((service) => {
                    const [y, m, d] = service.date!.split("-");
                    const dateLabel = `${d}/${m}/${y}`;
                    return (
                      <div
                        key={service.id}
                        className="flex items-baseline justify-between gap-4 border-t border-border-subtle py-3 text-sm"
                      >
                        <dt className="text-foreground-subtle">
                          {dateLabel}
                          {service.label && (
                            <span className="ml-2 text-[10px] uppercase tracking-[0.14em] text-accent">
                              {service.label}
                            </span>
                          )}
                        </dt>
                        <dd className="font-data text-foreground">{service.time}</dd>
                      </div>
                    );
                  })}
                </dl>
              </>
            )}
          </div>

          <div className="sm:col-span-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-foreground-subtle">Contato</p>
            <address className="font-data mt-4 flex flex-col gap-4 not-italic text-sm text-foreground-muted">
              <span className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-foreground-subtle" />
                {unit.address}
              </span>
              <a href={`tel:+${unit.contactPhoneE164}`} className="flex items-center gap-2 hover:text-accent">
                <Phone size={15} className="shrink-0 text-foreground-subtle" />
                {unit.contactPhoneDisplay}
              </a>
              <a href={`mailto:${unit.contactEmail}`} className="flex items-center gap-2 hover:text-accent">
                <Mail size={15} className="shrink-0 text-foreground-subtle" />
                {unit.contactEmail}
              </a>
            </address>

            <a
              href={mapsUrl(unit.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 border-b border-accent pb-1 text-[11px] uppercase tracking-[0.16em] text-accent transition-colors hover:border-foreground hover:text-foreground"
            >
              Como chegar
              <ArrowUpRight size={14} />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
