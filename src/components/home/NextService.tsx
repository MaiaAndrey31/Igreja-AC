"use client";

import { useSyncExternalStore } from "react";
import { MapPin } from "lucide-react";
import { mapsUrl, unit, WEEKDAY_LABELS } from "@/data/unit";
import { groupServicesByWeekday, relativeDayLabel, upcomingServices } from "@/lib/services";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

/**
 * "Próxima celebração", calculada a partir dos horários reais da unidade.
 *
 * A grade da semana é renderizada no servidor (é fato estável, indexável e
 * cacheável). O destaque de "qual é a próxima" só aparece depois do mount:
 * depende do relógio, e renderizá-lo no servidor deixaria a página estática
 * servindo um "hoje" velho. O fuso é sempre o da igreja — ver lib/services.
 *
 * O relógio é tratado como fonte externa: `useSyncExternalStore` devolve
 * `null` no servidor e na hidratação, e o minuto corrente depois disso. O
 * snapshot é o índice do minuto (não `Date.now()`), então ele é estável
 * entre renders dentro do mesmo minuto — requisito da API — e a assinatura
 * reavalia de minuto em minuto, para que uma aba aberta desde ontem não
 * continue anunciando o culto de ontem.
 */
const MINUTE = 60_000;

function subscribeToMinute(onChange: () => void) {
  const id = setInterval(onChange, MINUTE);
  return () => clearInterval(id);
}

const currentMinute = () => Math.floor(Date.now() / MINUTE);
const noClockOnServer = () => null;

export function NextService() {
  const minute = useSyncExternalStore(subscribeToMinute, currentMinute, noClockOnServer);
  const now = minute === null ? null : new Date(minute * MINUTE);

  const next = now ? upcomingServices(unit.services, now, 1)[0] : null;
  const week = groupServicesByWeekday(unit.services);

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <SectionEyebrow index={2}>Próxima celebração</SectionEyebrow>

        <div className="mt-12 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {/* min-h evita o salto de layout entre o SSR (sem relógio) e o
                primeiro render no cliente (com o destaque calculado). */}
            <div className="min-h-[7.5rem]">
              {next ? (
                <>
                  <p className="font-data text-[11px] uppercase tracking-[0.2em] text-accent">
                    {relativeDayLabel(next)}
                    {next.service.label && ` · ${next.service.label}`}
                  </p>
                  <p className="font-display mt-3 text-[clamp(3.5rem,14vw,8rem)] text-foreground">
                    {next.service.time}
                  </p>
                </>
              ) : (
                <p className="font-data text-sm text-foreground-subtle">Calculando o próximo horário…</p>
              )}
            </div>

            <p className="font-display mt-4 text-2xl uppercase text-foreground">{unit.name}</p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-data mt-3 flex items-start gap-2 text-sm leading-relaxed text-foreground-subtle transition-colors hover:text-accent"
            >
              <MapPin size={15} className="mt-0.5 shrink-0" />
              {unit.address}
            </a>
          </div>

          <div className="lg:col-span-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-foreground-subtle">Toda semana</p>
            <dl className="mt-5">
              {week.map(({ weekday, services }) => (
                <div
                  key={weekday}
                  className="flex items-baseline justify-between gap-6 border-t border-border-subtle py-4"
                >
                  <dt className="text-sm text-foreground-muted">
                    {WEEKDAY_LABELS[weekday]}
                    {services[0]?.label && (
                      <span className="ml-2 text-[11px] uppercase tracking-[0.16em] text-accent">
                        {services[0].label}
                      </span>
                    )}
                  </dt>
                  <dd className="font-data flex flex-wrap justify-end gap-x-3 gap-y-1 text-sm text-foreground">
                    {services.map((service) => (
                      <span key={`${service.weekday}-${service.time}`}>{service.time}</span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
