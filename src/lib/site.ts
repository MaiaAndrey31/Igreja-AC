/**
 * URL canônica do site — base para metadata, Open Graph, sitemap e schema.org.
 *
 * Ao contrário do e-mail institucional (iacadamantina@gmail.com, que não dá
 * nenhuma pista de domínio), não há fonte pública confirmando em qual domínio
 * este site vai ficar — o fallback abaixo é só um placeholder sintaticamente
 * válido. **Defina `NEXT_PUBLIC_SITE_URL` no ambiente de produção** assim que
 * o domínio real for definido; até lá, metadata/sitemap/schema.org apontam
 * para um endereço que não existe de verdade.
 */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.iacadamantina.example").replace(
  /\/$/,
  ""
);

export function absoluteUrl(path: string) {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
