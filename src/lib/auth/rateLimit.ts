import "server-only";
import { adminSecurityDoc, type AdminSecurityDoc } from "@/lib/firebase/collections";

/**
 * Proteção contra força bruta persistida no Firestore (sobrevive a restart do
 * servidor, diferente de um rate-limit apenas em memória). Após MAX_ATTEMPTS
 * tentativas falhas seguidas, a conta fica bloqueada por LOCK_MINUTES.
 *
 * Chaveado por e-mail (normalizado, ver `adminSecurityDoc`), não pelo uid do
 * Firebase Auth: o bloqueio precisa ser checado ANTES de tentar autenticar
 * (quando ainda não sabemos se o e-mail existe nem qual é o uid).
 */
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export interface LockStatus {
  locked: boolean;
  remainingMs: number;
  attemptsLeft: number;
}

export function getLockStatus(doc: AdminSecurityDoc): LockStatus {
  const now = Date.now();
  const lockedUntil = doc.lockedUntil ? doc.lockedUntil.getTime() : 0;
  const locked = lockedUntil > now;
  return {
    locked,
    remainingMs: locked ? lockedUntil - now : 0,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - doc.failedAttempts),
  };
}

export async function checkLockStatus(email: string): Promise<LockStatus> {
  const snap = await adminSecurityDoc(email).get();
  return getLockStatus(snap.exists ? snap.data()! : { failedAttempts: 0, lockedUntil: null });
}

export async function registerFailedLogin(email: string): Promise<LockStatus> {
  const ref = adminSecurityDoc(email);
  const snap = await ref.get();
  const current = snap.exists ? snap.data()! : { failedAttempts: 0, lockedUntil: null };

  const failedAttempts = current.failedAttempts + 1;
  const shouldLock = failedAttempts >= MAX_ATTEMPTS;
  const next: AdminSecurityDoc = {
    failedAttempts: shouldLock ? 0 : failedAttempts,
    lockedUntil: shouldLock ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : current.lockedUntil,
  };

  await ref.set(next);
  return getLockStatus(next);
}

export async function registerSuccessfulLogin(email: string): Promise<void> {
  await adminSecurityDoc(email).set({ failedAttempts: 0, lockedUntil: null });
}
