/**
 * Injeta um bloco schema.org na página.
 *
 * `type="application/ld+json"` não é executado pelo navegador; o CSP do
 * projeto já libera `script-src 'unsafe-inline'` (ver next.config.mjs), então
 * não há nonce a propagar aqui.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // O conteúdo vem só de dados nossos (src/data), nunca de entrada de
      // usuário; `</script>` é escapado por precaução mesmo assim.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
