const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", timeZone: "UTC" });
const dateFormatterFull = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });

export function formatEventDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatFullDate(date: Date): string {
  return dateFormatterFull.format(date);
}

export function formatWhatsappLink(whatsapp: string, message: string): string {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
}

export function youtubeWatchUrl(youtubeId: string) {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

/** Thumbnail servida pelo próprio YouTube — sem peso extra no nosso host. */
export function youtubeThumbnail(youtubeId: string) {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

/**
 * Aceita o que a igreja normalmente tem à mão — a URL inteira copiada do
 * navegador (`watch?v=`, `youtu.be/`, `/embed/`, `/shorts/`) ou já o ID puro
 * — e devolve só o ID de 11 caracteres. `null` quando não reconhece o
 * formato, para o schema rejeitar em vez de salvar um ID quebrado.
 */
export function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  return null;
}
