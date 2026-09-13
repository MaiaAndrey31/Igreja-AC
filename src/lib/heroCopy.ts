/**
 * Ponte entre o Hero editável pelo /admin e a identidade Amor e Cuidado
 * Adamantina.
 *
 * O texto e a mídia do Hero vivem em `SiteSettings`, editáveis pela igreja.
 * Mas um banco já semeado com valores de uma marca/escopo anterior (rede
 * nacional, ou a igreja que usava este projeto antes) continuaria servindo
 * aquele texto — então os defaults conhecidos são tratados como "ainda não
 * preenchido" e caem para a copy oficial de Adamantina.
 *
 * Quando a igreja salvar o próprio texto em /admin/configuracoes, ele passa a
 * ter precedência normalmente.
 */

export const HERO_DEFAULT_TITLE = "Amor e Cuidado em Adamantina";
export const HERO_DEFAULT_SUBTITLE = "Uma igreja pastoreada por células, em Adamantina e região.";

/** Valores que nunca devem aparecer no site — placeholders e escopos anteriores. */
const LEGACY_VALUES = new Set([
  "Uma comunidade remida para viver e anunciar o evangelho",
  "Cultos, células e ministérios em Balneário Camboriú",
  "Amor e Cuidado",
  "Aqui, você é cuidado — e enviado para cuidar.",
]);

const PLACEHOLDER_MEDIA = new Set(["/videos/hero-placeholder.mp4", "/videos/hero-poster.jpg"]);

function resolve(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  if (!trimmed || LEGACY_VALUES.has(trimmed)) return fallback;
  return trimmed;
}

export function heroTitle(value: string | null | undefined) {
  return resolve(value, HERO_DEFAULT_TITLE);
}

export function heroSubtitle(value: string | null | undefined) {
  return resolve(value, HERO_DEFAULT_SUBTITLE);
}

/**
 * `true` quando existe mídia real cadastrada. Enquanto a igreja não sobe o
 * vídeo/foto do culto, o Hero degrada para a camada de gradiente — nunca para
 * banco de imagens.
 */
export function hasRealMedia(url: string | null | undefined): url is string {
  return Boolean(url && !PLACEHOLDER_MEDIA.has(url));
}
