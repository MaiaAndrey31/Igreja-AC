/**
 * Migra para o Firestore os dados que, até a introdução do CRUD completo do
 * admin, viviam hardcoded em `src/data/*.ts` (liderança, mensagens/pregações,
 * links sociais, horários de celebração). `settings/unit`
 * (nome, história, contato, rede) não precisa de seed: nasce sozinho com os
 * valores atuais na primeira leitura (`UNIT_INFO_DEFAULTS`, ver
 * `getUnitInfo()` em src/lib/data.ts), mesmo padrão de `settings/site`.
 *
 * Uso:
 *   npm run seed:initial
 *
 * Idempotente: cada coleção só é semeada se estiver vazia — rodar de novo não
 * duplica nada. Isso também significa que editar um item pelo admin e depois
 * rodar o script de novo não o traz de volta.
 *
 * Fala com o Firestore direto via `db()` (não via `@/lib/firebase/collections`,
 * que importa `server-only` — inofensivo dentro do bundler do Next, mas lança
 * erro incondicional num script `tsx` puro; ver o comentário equivalente em
 * `src/lib/firebase/admin.ts`, que evita esse import pelo mesmo motivo).
 */
import { existsSync, readFileSync } from "node:fs";
import { FieldValue, type CollectionReference } from "firebase-admin/firestore";
import { db } from "../src/lib/firebase/admin";

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

// Conteúdo real, hoje vigente no site — o mesmo que estava em
// src/data/leaders.ts, src/data/messages.ts, src/data/socialLinks.ts e
// unit.services (em src/data/unit.ts) antes da migração para o Firestore. Os
// shapes espelham os `*Input` de src/lib/firebase/collections.ts.

const LEADERS = [
  { name: "Leonardo Costa", role: "Pastor Sênior", quote: null, photoUrl: "/assets/leaders/leonardo-costa.webp", active: true, order: 0 },
  { name: "Naiara Costa", role: "Pastora Sênior", quote: null, photoUrl: "/assets/leaders/naiara-costa.webp", active: true, order: 1 },
  { name: "Mariana Lemes", role: "Pastora — Intercessão, Profético e Sala de Cura", quote: null, photoUrl: "/assets/leaders/mariana-lemes.webp", active: true, order: 2 },
  { name: "Larissa Marquezin", role: "Pastora Alive Kids", quote: null, photoUrl: "/assets/leaders/larissa-marquezin.webp", active: true, order: 3 },
  { name: "Matheus Magnani", role: "Pastor de Adoração", quote: null, photoUrl: "/assets/leaders/matheus-magnani.webp", active: true, order: 4 },
  { name: "Antônio Marquette", role: "Pastor — Visitação e Oração (Casa Rayah)", quote: null, photoUrl: "/assets/leaders/antonio-marquette.webp", active: true, order: 5 },
  { name: "Victor Costa", role: "Pastor Gestor e Finanças", quote: null, photoUrl: "/assets/leaders/victor-costa.webp", active: true, order: 6 },
];

// Vazio hoje: nenhuma pregação tem link de YouTube confirmado ainda (ver o
// comentário original em src/data/messages.ts) — a igreja cadastra pelo
// /admin/mensagens assim que tiver os links.
const MESSAGES: Record<string, unknown>[] = [];

const SOCIAL_LINKS = [
  { platform: "instagram", label: "Instagram", handle: "@iacadamantina", href: "https://www.instagram.com/iacadamantina", external: true, order: 0 },
  { platform: "facebook", label: "Facebook", handle: "IACadamantina", href: "https://www.facebook.com/IACadamantina", external: true, order: 1 },
  { platform: "whatsapp", label: "WhatsApp", handle: "(18) 3880-0209", href: "https://wa.me/551838800209", external: true, order: 2 },
  { platform: "email", label: "E-mail", handle: "iacadamantina@gmail.com", href: "mailto:iacadamantina@gmail.com", external: false, order: 3 },
];

const SERVICES = [
  { weekday: 2, time: "20:00", label: null, order: 0 },
  { weekday: 6, time: "19:00", label: "Juventude Alive", order: 1 },
  { weekday: 0, time: "09:00", label: null, order: 2 },
  { weekday: 0, time: "16:00", label: null, order: 3 },
  { weekday: 0, time: "18:30", label: null, order: 4 },
];

async function seedIfEmpty(
  label: string,
  collection: CollectionReference,
  items: Record<string, unknown>[]
): Promise<void> {
  const existing = await collection.count().get();
  if (existing.data().count > 0) {
    console.log(`${label}: já tem dados — pulando.`);
    return;
  }
  if (items.length === 0) {
    console.log(`${label}: nada para semear.`);
    return;
  }

  const batch = collection.firestore.batch();
  const now = FieldValue.serverTimestamp();
  for (const item of items) {
    const ref = collection.doc();
    batch.set(ref, { ...item, createdAt: now, updatedAt: now });
  }
  await batch.commit();
  console.log(`${label}: ${items.length} documento(s) criado(s).`);
}

async function main() {
  await seedIfEmpty("leaders", db().collection("leaders"), LEADERS);
  await seedIfEmpty("messages", db().collection("messages"), MESSAGES);
  await seedIfEmpty("socialLinks", db().collection("socialLinks"), SOCIAL_LINKS);
  await seedIfEmpty("services", db().collection("services"), SERVICES);
  console.log("Seed concluído. Dados institucionais (settings/unit) nascem sozinhos na primeira leitura.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
