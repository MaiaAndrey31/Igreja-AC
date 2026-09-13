/**
 * Marcador único para dado que a igreja ainda não publicou.
 *
 * Regra do projeto: nada sobre a Amor e Cuidado é inventado. Horário,
 * endereço, nome de pastor, data de evento ou frase institucional que não
 * tenha fonte verificada aparece literalmente como `[CONTEÚDO PENDENTE]` na
 * UI — assim o que falta fica visível para a igreja preencher, em vez de
 * virar texto plausível e errado.
 */
export const PENDING = "[CONTEÚDO PENDENTE]";

/** Devolve o valor ou o marcador — evita `?? PENDING` repetido nas views. */
export function orPending(value: string | null | undefined): string {
  return value?.trim() ? value : PENDING;
}
