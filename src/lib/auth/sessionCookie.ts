/**
 * Só a constante do nome do cookie — sem `import "server-only"`, sem
 * Firebase Admin SDK, sem nada que não rode no Edge runtime.
 *
 * `src/proxy.ts` roda no Edge (o Admin SDK não funciona lá — ver o comentário
 * em src/proxy.ts) e só precisa saber o NOME do cookie para checar presença;
 * se ele importasse essa constante de `src/lib/auth/session.ts`, arrastaria
 * junto o Firebase Admin SDK inteiro para o bundle do Edge, que quebraria o
 * build (o Admin SDK depende de APIs de Node que o Edge não tem).
 *
 * `src/lib/auth/session.ts` reexporta esta constante para o resto do app
 * (que roda em Node) continuar importando de um lugar só.
 */
export const SESSION_COOKIE_NAME = "admin_session";
