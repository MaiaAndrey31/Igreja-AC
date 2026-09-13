import { z } from "zod";

/**
 * Política mínima de senha do admin: 10+ caracteres, com maiúscula, minúscula,
 * número e caractere especial. Validada aqui (fonte da verdade, server-side) e
 * espelhada no client apenas para feedback visual — nunca confiar só na UI.
 *
 * O hash/verificação da senha em si é responsabilidade do Firebase Auth (ver
 * src/actions/auth.ts) — este arquivo só cuida da política e do feedback
 * visual de força, que não mudam com o provedor de autenticação.
 */
export const passwordPolicySchema = z
  .string()
  .min(10, "A senha precisa ter no mínimo 10 caracteres.")
  .regex(/[a-z]/, "A senha precisa ter ao menos uma letra minúscula.")
  .regex(/[A-Z]/, "A senha precisa ter ao menos uma letra maiúscula.")
  .regex(/[0-9]/, "A senha precisa ter ao menos um número.")
  .regex(/[^A-Za-z0-9]/, "A senha precisa ter ao menos um caractere especial.");

export type PasswordStrength = "fraca" | "média" | "forte";

/** Feedback visual de força — não substitui a validação de política acima. */
export function estimatePasswordStrength(plain: string): PasswordStrength {
  let score = 0;
  if (plain.length >= 10) score++;
  if (plain.length >= 14) score++;
  if (/[a-z]/.test(plain) && /[A-Z]/.test(plain)) score++;
  if (/[0-9]/.test(plain)) score++;
  if (/[^A-Za-z0-9]/.test(plain)) score++;

  if (score <= 2) return "fraca";
  if (score <= 4) return "média";
  return "forte";
}
