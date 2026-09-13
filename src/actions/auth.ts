"use server";

import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";
import { InvalidCredentialsError, signInWithPassword } from "@/lib/firebase/identityToolkit";
import {
  createSessionCookie,
  setSessionCookie,
  clearSessionCookie,
  requireAdminSession,
} from "@/lib/auth/session";
import { checkLockStatus, registerFailedLogin, registerSuccessfulLogin } from "@/lib/auth/rateLimit";
import { loginSchema, changePasswordSchema } from "@/lib/validation/schemas";

export interface ActionState {
  error?: string;
  success?: boolean;
}

function minutesLeft(ms: number): number {
  return Math.max(1, Math.ceil(ms / 60000));
}

/** Chave do bloqueio de tentativas e do usuário no Firebase Auth — sempre normalizado. */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const email = normalizeEmail(parsed.data.email);
  // Resposta idêntica para "não existe", "senha errada" e "não é admin" —
  // evita enumeração de contas.
  const genericError = "E-mail ou senha inválidos.";

  const lock = await checkLockStatus(email);
  if (lock.locked) {
    return {
      error: `Conta temporariamente bloqueada por tentativas seguidas. Tente novamente em ${minutesLeft(lock.remainingMs)} min.`,
    };
  }

  let signIn;
  try {
    signIn = await signInWithPassword(email, parsed.data.password);
  } catch (err) {
    if (!(err instanceof InvalidCredentialsError)) throw err;
    const updatedLock = await registerFailedLogin(email);
    if (updatedLock.locked) {
      return { error: "Conta bloqueada por 15 min após muitas tentativas falhas." };
    }
    return { error: `${genericError} (${updatedLock.attemptsLeft} tentativa(s) restante(s))` };
  }

  // A senha bateu, mas só quem carrega a custom claim "admin" (definida em
  // scripts/create-admin.ts) pode entrar no painel — protege contra qualquer
  // outra conta que um dia exista no mesmo projeto Firebase Auth.
  const user = await adminAuth().getUser(signIn.uid);
  if (user.customClaims?.admin !== true) {
    await registerFailedLogin(email);
    return { error: genericError };
  }

  await registerSuccessfulLogin(email);
  const sessionCookie = await createSessionCookie(signIn.idToken);
  await setSessionCookie(sessionCookie);

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/admin/login");
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdminSession();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  // O Admin SDK não verifica senha (só gerencia usuários/tokens) — confirma a
  // senha atual reautenticando pela mesma API REST do login.
  try {
    await signInWithPassword(session.email, parsed.data.currentPassword);
  } catch (err) {
    if (!(err instanceof InvalidCredentialsError)) throw err;
    return { error: "Senha atual incorreta." };
  }

  await adminAuth().updateUser(session.uid, { password: parsed.data.newPassword });

  // Invalida toda sessão existente (inclusive outros navegadores/dispositivos)
  // e emite uma nova só para quem está fazendo a troca agora — a ordem
  // importa: revogar e SÓ DEPOIS reautenticar garante que o novo cookie tenha
  // um "emitido em" posterior à revogação, então `verifySessionCookie` (com
  // checkRevoked) não o rejeita.
  await adminAuth().revokeRefreshTokens(session.uid);
  const reSignIn = await signInWithPassword(session.email, parsed.data.newPassword);
  const sessionCookie = await createSessionCookie(reSignIn.idToken);
  await setSessionCookie(sessionCookie);

  return { success: true };
}
