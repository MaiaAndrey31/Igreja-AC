// `import type` — este arquivo é importado por componentes client (ver
// NextService.tsx), e `@/lib/firebase/collections` carrega `server-only`.
// Um import só de tipo é apagado na compilação, então não puxa esse módulo
// para o bundle do navegador.
import type { Service } from "@/lib/firebase/collections";

/**
 * Cálculo da próxima celebração a partir dos horários cadastrados.
 *
 * Tudo é resolvido no fuso da igreja (America/São_Paulo), não no do
 * visitante nem no do servidor: "domingo às 9h" é 9h em Adamantina,
 * independente de quem está olhando ou de onde o Node está rodando.
 */

/** 0 = domingo … 6 = sábado (mesma convenção de `Date#getDay`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

const CHURCH_TIMEZONE = "America/Sao_Paulo";

const WEEKDAY_FROM_SHORT: Record<string, Weekday> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const churchClockFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CHURCH_TIMEZONE,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Dia da semana e minutos desde a meia-noite, no relógio da igreja. */
export function churchClock(now: Date): { weekday: Weekday; minutes: number } {
  const parts = churchClockFormatter.formatToParts(now);
  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const weekday = WEEKDAY_FROM_SHORT[lookup("weekday")] ?? 0;
  // `hour12: false` pode devolver "24" para meia-noite em alguns runtimes.
  const hour = Number(lookup("hour")) % 24;
  const minute = Number(lookup("minute"));

  return { weekday, minutes: hour * 60 + minute };
}

function serviceMinutes(service: Service): number {
  const [hour, minute] = service.time.split(":").map(Number);
  return hour * 60 + minute;
}

export interface UpcomingService {
  service: Service;
  /** 0 = hoje, 1 = amanhã, … */
  daysAhead: number;
  /** Minutos até o início — usado só para ordenar. */
  minutesUntil: number;
}

/**
 * Ordena os horários pela proximidade, dando a volta na semana. Um culto que
 * já começou hoje é empurrado para a semana seguinte.
 */
export function upcomingServices(services: Service[], now: Date, count = 3): UpcomingService[] {
  const { weekday, minutes } = churchClock(now);

  return services
    .map((service) => {
      const start = serviceMinutes(service);
      let daysAhead = (service.weekday - weekday + 7) % 7;
      if (daysAhead === 0 && start <= minutes) daysAhead = 7;

      return { service, daysAhead, minutesUntil: daysAhead * 24 * 60 + start - minutes };
    })
    .sort((a, b) => a.minutesUntil - b.minutesUntil)
    .slice(0, count);
}

/** "Hoje" / "Amanhã" / "Domingo" — o rótulo que o visitante lê. */
export function relativeDayLabel(upcoming: UpcomingService): string {
  if (upcoming.daysAhead === 0) return "Hoje";
  if (upcoming.daysAhead === 1) return "Amanhã";
  return WEEKDAY_LABELS[upcoming.service.weekday];
}

/** Agrupa por dia da semana, na ordem domingo → sábado, para a grade fixa. */
export function groupServicesByWeekday(services: Service[]): { weekday: Weekday; services: Service[] }[] {
  const byWeekday = new Map<Weekday, Service[]>();

  for (const service of services) {
    const bucket = byWeekday.get(service.weekday);
    if (bucket) bucket.push(service);
    else byWeekday.set(service.weekday, [service]);
  }

  return [...byWeekday.entries()]
    .sort(([a], [b]) => a - b)
    .map(([weekday, list]) => ({
      weekday,
      services: [...list].sort((a, b) => serviceMinutes(a) - serviceMinutes(b)),
    }));
}
