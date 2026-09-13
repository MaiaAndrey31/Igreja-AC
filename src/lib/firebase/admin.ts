// Sem `import "server-only"` aqui de propósito: este módulo também é
// importado por scripts/create-admin.ts (rodado via `tsx`, fora do bundler
// do Next.js). O pacote `server-only` só é "inofensivo" quando o webpack/
// Turbopack do Next intercepta o import; fora desse contexto (Node puro,
// como um script `tsx`) ele lança erro incondicionalmente, mesmo em código
// que é, de fato, server-only. `firebase-admin` já usa APIs exclusivas de
// Node (fs, crypto) — um bundle de cliente falharia ao tentar incluir isto
// de qualquer forma, então a guarda aqui seria redundante.
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

/**
 * Inicialização única do Firebase Admin SDK — usado aqui só para Firestore
 * (banco) e Authentication (login do admin). Uploads de mídia vão para disco
 * local (ver src/lib/upload.ts), não para o Firebase Storage.
 *
 * Só o servidor fala com o Firebase neste projeto (Server Components e
 * Server Actions, nunca o navegador) — o Admin SDK usa a service account do
 * projeto e ignora as Firestore Security Rules por completo. As rules (ver
 * firestore.rules na raiz do repo) existem como defesa em profundidade, não
 * como o mecanismo principal de controle de acesso — quem controla o acesso
 * são as próprias Server Actions, via `requireAdminSession()`.
 *
 * `getApps().length` evita reinicializar o app a cada hot-reload do
 * `next dev`.
 */

function getFirebaseApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // A chave privada chega ao ambiente com `\n` literais (não quebras de
  // linha reais) sempre que passa por um .env ou por um painel de variáveis
  // de ambiente de hospedagem — precisa ser desfeito antes de virar PEM.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Credenciais do Firebase ausentes. Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e " +
        "FIREBASE_PRIVATE_KEY (ver .env.example)."
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

let firestoreInstance: Firestore | undefined;
let authInstance: Auth | undefined;

export function db(): Firestore {
  firestoreInstance ??= getFirestore(getFirebaseApp());
  return firestoreInstance;
}

export function adminAuth(): Auth {
  authInstance ??= getAuth(getFirebaseApp());
  return authInstance;
}
