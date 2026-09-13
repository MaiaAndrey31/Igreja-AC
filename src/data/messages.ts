/**
 * Últimas mensagens.
 *
 * A unidade publica pregações da série "Uma Vida Abençoada" (pregada pelo
 * Bp. Marcelo Toschi, publicada também na página da unidade) — títulos e
 * datas reais confirmados incluem "Quebrando o Espírito de Mamom" (13/07/2026)
 * e "O Princípio do Primeiro" (05/07/2026). Mas nenhum vídeo específico tem
 * ID do YouTube confirmado, e a regra do projeto é não inventar link — por
 * isso a lista abaixo nasce vazia. Quando a igreja indicar quais vídeos
 * destacar (com o link real), preencha um item com dados reais — `youtubeId`
 * é o que vem depois de `?v=` na URL do YouTube.
 */

export interface Message {
  slug: string;
  title: string;
  /** Quem pregou. Ex.: "Bispo Marcelo Toschi". */
  speaker: string;
  /** ISO `YYYY-MM-DD`. */
  date: string;
  youtubeId: string;
}

export const messages: Message[] = [];

export function youtubeWatchUrl(youtubeId: string) {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

/** Thumbnail servida pelo próprio YouTube — sem peso extra no nosso host. */
export function youtubeThumbnail(youtubeId: string) {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}
