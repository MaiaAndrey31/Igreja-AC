import { NextResponse, type NextRequest } from "next/server";
// Importa da constante isolada (não de "@/lib/auth/session"): esse módulo
// carrega o Firebase Admin SDK, que não roda no Edge runtime deste
// middleware — ver o comentário em src/lib/auth/sessionCookie.ts.
import { SESSION_COOKIE_NAME } from "@/lib/auth/sessionCookie";

/**
 * Guarda de borda para o painel admin: qualquer requisição a /admin/** que não
 * seja a própria tela de login precisa ter o cookie de sessão presente.
 *
 * Esta é só a camada de UX/redirecionamento — roda no Edge runtime, que não
 * suporta o Firebase Admin SDK (depende de APIs de Node que o Edge não tem),
 * então aqui não dá pra verificar criptograficamente se o cookie é válido,
 * só se ele existe. A verificação completa (`verifySessionCookie`, com
 * checagem de revogação) acontece em runtime Node.js, dentro de
 * `requireAdminSession()` — chamada por toda Server Action de mutação e pelo
 * layout do painel (`src/app/admin/(dashboard)/layout.tsx`). Um cookie
 * presente mas inválido/expirado passa por aqui e é barrado logo em seguida,
 * então isso nunca é a única barreira.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!hasSessionCookie) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
