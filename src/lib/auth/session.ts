import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/sessionCookie";

export { SESSION_COOKIE_NAME };

/**
 * Sessão do admin via Firebase Auth session cookie (não JWT próprio).
 *
 * `createSessionCookie` chama o Admin SDK, que troca um ID token recém-emitido
 * (de um login bem-sucedido — ver src/actions/auth.ts) por um cookie de sessão
 * assinado pelo Google, opaco para nós. `verifySessionCookie` faz a verificação
 * criptográfica completa — só roda em runtime Node.js (Server Components/
 * Actions), nunca no Edge, porque o Admin SDK depende de APIs que o Edge
 * runtime não tem. Por isso `src/proxy.ts` (que roda no Edge) só confere se o
 * cookie *existe*, como camada de UX/redirecionamento — a verificação real e
 * obrigatória é sempre `requireAdminSession()`, chamada por dentro de cada
 * Server Action e do layout do painel.
 */

// Limite do Firebase: entre 5 minutos e 2 semanas, em milissegundos.
const SESSION_EXPIRES_IN_MS = 5 * 24 * 60 * 60 * 1000; // 5 dias

export interface SessionPayload {
  uid: string;
  email: string;
}

/** Troca um ID token (obtido no login) por um cookie de sessão opaco. */
export async function createSessionCookie(idToken: string): Promise<string> {
  return adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_EXPIRES_IN_MS });
}

export async function setSessionCookie(cookieValue: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_EXPIRES_IN_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

/**
 * Verifica a sessão atual (runtime Node — Server Component/Action).
 * `checkRevoked: true` consulta o Firebase Auth para saber se a sessão foi
 * invalidada manualmente (ex.: troca de senha, ver changePasswordAction) —
 * sem isso, um cookie roubado continuaria válido até expirar sozinho.
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const cookieValue = store.get(SESSION_COOKIE_NAME)?.value;
  if (!cookieValue) return null;

  try {
    const decoded = await adminAuth().verifySessionCookie(cookieValue, true);
    // Defesa extra: só reconhece sessão de quem carrega a custom claim
    // "admin" (definida em scripts/create-admin.ts). Hoje só existe esse tipo
    // de usuário no projeto Firebase, mas isso evita que qualquer conta
    // futura no mesmo projeto Auth entre no painel por engano.
    if (decoded.admin !== true || typeof decoded.email !== "string") return null;
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}

/**
 * Toda Server Action de mutação do admin deve chamar isto antes de tocar no
 * Firestore/Storage. Nunca confiar apenas na UI/middleware — a action
 * revalida a sessão por si mesma.
 */
export async function requireAdminSession(): Promise<SessionPayload> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("Não autenticado.");
  }
  return session;
}
