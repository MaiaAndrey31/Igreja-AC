import "server-only";

/**
 * Login por e-mail/senha, chamado do servidor via REST — não pelo SDK do
 * cliente do Firebase (o navegador nunca fala com o Firebase neste projeto,
 * ver src/lib/firebase/admin.ts). O Admin SDK não verifica senha (só gerencia
 * usuários e tokens), então essa é a única forma de confirmar a senha sem
 * expor nada ao navegador: o servidor chama a mesma API que o SDK do cliente
 * chamaria, com a FIREBASE_WEB_API_KEY (não é secreta — é a mesma chave
 * pública usada em qualquer config de app Firebase, só identifica o projeto).
 *
 * Reaproveitado também na troca de senha, para confirmar a senha atual antes
 * de trocar (ver changePasswordAction).
 */

const SIGN_IN_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";

export interface SignInResult {
  idToken: string;
  uid: string;
  email: string;
}

/** Credenciais recusadas pelo Firebase (e-mail inexistente, senha errada, conta desativada, etc.). */
export class InvalidCredentialsError extends Error {}

export async function signInWithPassword(email: string, password: string): Promise<SignInResult> {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) {
    throw new Error("FIREBASE_WEB_API_KEY ausente. Defina em .env (ver .env.example).");
  }

  const response = await fetch(`${SIGN_IN_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
    // Nunca cachear uma tentativa de login.
    cache: "no-store",
  });

  const body = await response.json();

  if (!response.ok) {
    // Mensagens possíveis: EMAIL_NOT_FOUND, INVALID_PASSWORD,
    // INVALID_LOGIN_CREDENTIALS, USER_DISABLED, TOO_MANY_ATTEMPTS_TRY_LATER —
    // todas tratadas da mesma forma pelo chamador (erro genérico, sem
    // distinguir motivo, para não dar pista de quais e-mails têm conta).
    throw new InvalidCredentialsError(body?.error?.message ?? "Falha ao autenticar.");
  }

  return { idToken: body.idToken, uid: body.localId, email: body.email };
}
