const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", timeZone: "UTC" });
const dateFormatterFull = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });

export function formatEventDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatFullDate(date: Date): string {
  return dateFormatterFull.format(date);
}

/**
 * Data de mensagem/pregação, guardada como string ISO `YYYY-MM-DD` em
 * `src/data/messages.ts`. Interpretada como UTC de propósito: a data de uma
 * pregação é um rótulo de calendário, não um instante — sem isso, "2026-03-08"
 * vira 07/03 para quem está a oeste de Greenwich.
 */
export function formatMessageDate(isoDate: string): string {
  return dateFormatterFull.format(new Date(`${isoDate}T00:00:00Z`));
}

export function formatWhatsappLink(whatsapp: string, message: string): string {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
}
