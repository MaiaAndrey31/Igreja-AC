/**
 * Ponte entre o Hero editável pelo /admin e a identidade Amor e Cuidado
 * Adamantina.
 *
 * O texto e a mídia do Hero vivem em `SiteSettings`, editáveis pela igreja em
 * /admin/configuracoes. Só o campo estar vazio cai para a copy padrão — uma
 * vez que a igreja salva algo pelo painel, o valor é sempre respeitado, ainda
 * que coincida textualmente com uma copy antiga de outro escopo do projeto
 * (não dá pra "banir" um texto específico sem impedir a igreja de escolher
 * esse mesmo texto de propósito).
 */

export const HERO_DEFAULT_TITLE = "Amor e Cuidado em Adamantina";
export const HERO_DEFAULT_SUBTITLE = "Uma igreja pastoreada por células, em Adamantina e região.";

const PLACEHOLDER_MEDIA = new Set(["/videos/hero-placeholder.mp4", "/videos/hero-poster.jpg"]);

function resolve(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
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
