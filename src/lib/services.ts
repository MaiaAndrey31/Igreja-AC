// `import type` — este arquivo é importado por componentes client (ver
// NextService.tsx), e `@/lib/firebase/collections` carrega `server-only`.
// Um import só de tipo é apagado na compilação, então não puxa esse módulo
// para o bundle do navegador.
import type { Service, ScheduleType } from "@/lib/firebase/collections";

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
      let daysAhead = (service.weekday! - weekday + 7) % 7;
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
  return WEEKDAY_LABELS[upcoming.service.weekday!];
}

/** Agrupa por dia da semana, na ordem domingo → sábado, para a grade fixa.
 *  Inclui somente horários semanais (`type === "weekly"`). */
export function groupServicesByWeekday(services: Service[]): { weekday: Weekday; services: Service[] }[] {
  const byWeekday = new Map<Weekday, Service[]>();

  for (const service of services) {
    if (service.type !== "weekly" || service.weekday == null) continue;
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

// ---------------------------------------------------------------------------
// Acontecimentos únicos — filtragem e ordenação
// ---------------------------------------------------------------------------

/**
 * Converte uma data "YYYY-MM-DD" + horário "HH:MM" em milissegundos no fuso
 * da igreja (America/Sao_Paulo), evitando deslocamento de dia causado por UTC.
 */
function dateTimeInChurchTz(dateStr: string, timeStr: string): number {
  // Constrói um ISO-like string e usa o formatter para resolver no fuso correto.
  // Abordagem: criar a data via partes e usar Intl para obter o timestamp local.
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);

  // Cria uma data UTC e ajusta usando o offset do fuso da igreja.
  const utcMs = Date.UTC(year, month - 1, day, hour, minute);

  // Obtém o offset do fuso America/Sao_Paulo para esta data específica.
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CHURCH_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Binary search approach: convert UTC ms to church-local by checking what
  // the formatter produces. Simpler: use a direct approach with ZonedDateTime
  // equivalent via temporal arithmetic.
  // For correctness without Temporal API, we compute the offset:
  const testDate = new Date(utcMs);
  const churchParts = formatter.formatToParts(testDate);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    churchParts.find((p) => p.type === type)?.value ?? "0";

  const churchUtc = Date.UTC(
    Number(getPart("year")),
    Number(getPart("month")) - 1,
    Number(getPart("day")),
    Number(getPart("hour")) % 24,
    Number(getPart("minute")),
    Number(getPart("second"))
  );

  const offsetMs = churchUtc - utcMs;
  // O timestamp real em UTC que corresponde ao horário local desejado:
  return utcMs - offsetMs;
}

/** Retorna apenas os acontecimentos únicos cuja data+horário ainda é futura. */
export function filterFutureOneTimeServices(services: Service[], now: Date): Service[] {
  const nowMs = now.getTime();
  return services.filter((s) => {
    if (s.type !== "one_time" || !s.date) return false;
    return dateTimeInChurchTz(s.date, s.time) > nowMs;
  });
}

/** Ordena acontecimentos únicos por data+horário ascendente (mais próximo primeiro). */
export function sortOneTimeServices(services: Service[]): Service[] {
  return [...services].sort((a, b) => {
    const aMs = dateTimeInChurchTz(a.date!, a.time);
    const bMs = dateTimeInChurchTz(b.date!, b.time);
    return aMs - bMs;
  });
}

/** Separa serviços em semanais e acontecimentos únicos. */
export function partitionServices(services: Service[]): {
  weekly: Service[];
  oneTime: Service[];
} {
  const weekly: Service[] = [];
  const oneTime: Service[] = [];
  for (const s of services) {
    if (s.type === "one_time") oneTime.push(s);
    else weekly.push(s);
  }
  return { weekly, oneTime };
}
