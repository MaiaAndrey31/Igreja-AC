/**
 * Cria (ou atualiza) o usuário administrador no Firebase Auth e concede a ele
 * a custom claim "admin" — é essa claim que dá acesso ao painel `/admin`
 * (ver requireAdminSession em src/lib/auth/session.ts). Substitui o antigo
 * `prisma/seed.ts`: não existe mais "seed de banco" — o Firestore não tem
 * schema, as coleções nascem no primeiro documento gravado.
 *
 * Uso:
 *   npm run admin:create
 *
 * Lê ADMIN_EMAIL e ADMIN_PASSWORD do .env (ver .env.example) ou do ambiente.
 * Idempotente: rodar de novo com o mesmo e-mail atualiza a senha e reafirma
 * a claim, em vez de falhar.
 */
import { existsSync, readFileSync } from "node:fs";
import { adminAuth } from "../src/lib/firebase/admin";

// Este script roda fora do Next.js (que carrega .env sozinho) — um parser
// mínimo evita depender do pacote `dotenv` só para isto. Não sobrescreve uma
// variável que já veio do shell/ambiente de CI.
function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = /^\s*([\w.-]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    const quoted = /^(['"]).*\1$/.test(rawValue);
    process.env[key] = quoted ? rawValue.slice(1, -1) : rawValue;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "Defina ADMIN_EMAIL e ADMIN_PASSWORD (em .env ou como variáveis de ambiente) antes de rodar."
    );
    process.exit(1);
  }

  const auth = adminAuth();

  const user = await auth
    .getUserByEmail(email)
    .then(async (existing) => {
      await auth.updateUser(existing.uid, { password });
      console.log(`Usuário já existia — senha atualizada: ${email}`);
      return existing;
    })
    .catch(async (err: { code?: string }) => {
      if (err?.code !== "auth/user-not-found") throw err;
      const created = await auth.createUser({ email, password, emailVerified: true });
      console.log(`Usuário criado: ${email}`);
      return created;
    });

  await auth.setCustomUserClaims(user.uid, { admin: true });
  console.log('Claim "admin" definida.');
  console.log("Pronto. Troque a senha padrão assim que fizer o primeiro login, em /admin/senha.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
