/**
 * Lógica pura de disponibilidade de formulários dinâmicos.
 *
 * Este módulo é isomorfo (roda em client e server) e NÃO depende de Firebase
 * nem de `server-only`. A decisão de "o formulário está aceitando respostas?"
 * é derivada deterministicamente dos campos do documento — nunca de um campo
 * `status` isolado que possa ficar desatualizado.
 */

import type {
  AvailabilityConfig,
  FormAdminStatus,
  FormEffectiveStatus,
} from "./types";

export interface AvailabilityInput {
  adminStatus: FormAdminStatus;
  availability: AvailabilityConfig;
  submissionCount: number;
  maxSubmissions: number | null;
}

/**
 * Calcula o status efetivo no momento da consulta.
 *
 * Prioridade:
 * 1. `archived` → sempre archived.
 * 2. `draft` → sempre draft.
 * 3. Limite de vagas atingido → full.
 * 4. Modo scheduled: compara now com opensAt/closesAt.
 * 5. Modo duration: compara now com activatedAt + durationHours.
 * 6. Modo manual: aberto se activatedAt existir.
 */
export function computeEffectiveStatus(
  input: AvailabilityInput,
  now: Date = new Date()
): FormEffectiveStatus {
  if (input.adminStatus === "archived") return "archived";
  if (input.adminStatus === "draft") return "draft";

  // Limite de vagas tem prioridade sobre disponibilidade temporal
  if (
    input.maxSubmissions !== null &&
    input.submissionCount >= input.maxSubmissions
  ) {
    return "full";
  }

  const { mode, opensAt, closesAt, durationHours, activatedAt } =
    input.availability;

  if (mode === "scheduled") {
    if (opensAt && now < opensAt) return "not_yet_open";
    if (closesAt && now >= closesAt) return "closed_by_schedule";
    return "open";
  }

  if (mode === "duration") {
    if (!activatedAt) return "not_yet_open";
    if (durationHours != null && durationHours > 0) {
      const expiresAt = new Date(
        activatedAt.getTime() + durationHours * 60 * 60 * 1000
      );
      if (now >= expiresAt) return "closed_by_duration";
    }
    return "open";
  }

  // mode === "manual"
  if (!activatedAt) return "not_yet_open";
  return "open";
}

/**
 * Verifica se o formulário aceita submissões neste instante.
 * Usada tanto no servidor (antes de gravar) quanto na UI pública.
 */
export function isFormAcceptingSubmissions(
  input: AvailabilityInput,
  now?: Date
): boolean {
  return computeEffectiveStatus(input, now) === "open";
}