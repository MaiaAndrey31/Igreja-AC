/**
 * Gera um UUID v4 no client-side sem depender de `node:crypto`.
 * Usa `crypto.randomUUID()` quando disponível (browsers modernos e Node 19+),
 * com fallback para geração manual baseada em `Math.random()`.
 */
export function randomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback RFC 4122 v4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}