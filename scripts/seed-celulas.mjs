/**
 * Seed idempotente das 61 células para o Firestore.
 *
 * Uso:
 *   node scripts/seed-celulas.mjs            # preview (não grava)
 *   node scripts/seed-celulas.mjs --confirm  # grava de fato
 *
 * Dados: celulas-seed.json (61 registros da planilha Celulas_Ativas_Com_Nome_Lideres.xlsx)
 * Coleção: cells
 * Chave de deduplicação: sourceId (nunca sobrescreve por nome)
 *
 * Regras:
 * - Preserva coordenadas verificadas/manuais em documentos existentes.
 * - Não publica automaticamente (published = false).
 * - Não inventa latitude/longitude.
 * - Sinaliza registros com dados ausentes como reviewStatus = "pending".
 * - Preserva integralmente os nomes dos líderes da coluna leaderName.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "..", ".env") });

// ---------------------------------------------------------------------------
// Inicialização Firebase Admin
// ---------------------------------------------------------------------------

function initAdmin() {
  if (getApps().length > 0) return getFirestore();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Credenciais do Firebase ausentes. Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no .env"
    );
  }

  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore();
}

// ---------------------------------------------------------------------------
// Normalização
// ---------------------------------------------------------------------------

function normalizeCitySlug(city) {
  if (!city) return null;
  return city
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeRegion(region) {
  if (!region) return null;
  const map = {
    Vermelha: "vermelha",
    Verde: "verde",
    Amarela: "amarela",
    Azul: "azul",
    Laranja: "laranja",
  };
  return map[region] ?? null;
}

function parseMeetingText(meetingText) {
  if (!meetingText) return { meetingDay: null, meetingTime: null };

  // Extrai dia e horário de textos como "Quarta às 20:00", "3ª às 19:00", "Segunda 20:00"
  const dayMap = {
    Segunda: "Segunda",
    Terça: "Terça",
    "3ª": "Terça",
    Quarta: "Quarta",
    Quinta: "Quinta",
    Sexta: "Sexta",
    Sábado: "Sábado",
    Domingo: "Domingo",
  };

  let meetingDay = null;
  let meetingTime = null;

  for (const [key, value] of Object.entries(dayMap)) {
    if (meetingText.includes(key)) {
      meetingDay = value;
      break;
    }
  }

  const timeMatch = meetingText.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    meetingTime = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
  }

  return { meetingDay, meetingTime };
}

// ---------------------------------------------------------------------------
// Dados
// ---------------------------------------------------------------------------

const seedDataPath = resolve(__dirname, "..", "celulas-seed.json");
const rawCells = JSON.parse(readFileSync(seedDataPath, "utf-8"));

console.log(`\n📂 Dados carregados de: ${seedDataPath}`);
console.log(`📊 Total de registros no JSON: ${rawCells.length}\n`);

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

async function main() {
  const confirm = process.argv.includes("--confirm");
  const db = initAdmin();
  const cellsRef = db.collection("cells");

  // Busca documentos existentes indexados por sourceId
  const existingSnap = await cellsRef.where("sourceId", "!=", null).get();
  const existingBySourceId = new Map();
  for (const doc of existingSnap.docs) {
    const data = doc.data();
    if (data.sourceId != null) {
      existingBySourceId.set(String(data.sourceId), { ...data, _docId: doc.id });
    }
  }

  console.log(`📋 Células já cadastradas com sourceId: ${existingBySourceId.size}\n`);

  let toCreate = 0;
  let toUpdate = 0;
  let toSkip = 0;
  const needsReview = [];
  const preview = [];

  for (const raw of rawCells) {
    const sourceId = String(raw.sourceId);
    const citySlug = normalizeCitySlug(raw.city);
    const region = normalizeRegion(raw.region);
    const { meetingDay, meetingTime } = parseMeetingText(raw.meetingText);

    const missingCritical = !raw.city || !raw.address || !raw.leaderName;
    const isPendingReview = raw.reviewStatus === "pending" || missingCritical;

    if (isPendingReview) {
      const reasons = [];
      if (!raw.city) reasons.push("cidade ausente");
      if (!raw.address) reasons.push("endereço ausente");
      if (!raw.leaderName) reasons.push("líder ausente");
      if (raw.reviewStatus === "pending") reasons.push("sinalizado como pendente na planilha");
      needsReview.push(`${sourceId} — ${raw.name}: ${reasons.join(", ")}`);
    }

    const existing = existingBySourceId.get(sourceId);

    let action;
    if (existing) {
      const preserveCoords =
        existing.geocodeStatus === "verified" || existing.geocodeStatus === "manual";
      if (preserveCoords) {
        toSkip++;
        action = "⏭️  PRESERVAR";
      } else {
        toUpdate++;
        action = "🔄 ATUALIZAR";
      }
    } else {
      toCreate++;
      action = "➕ CRIAR";
    }

    preview.push({
      action,
      sourceId,
      name: raw.name,
      leaderName: raw.leaderName ?? "(ausente)",
      city: raw.city ?? "(ausente)",
      region: region ?? "(ausente)",
      review: isPendingReview ? "⚠️" : "✅",
    });
  }

  // Exibe preview
  console.log("═".repeat(90));
  console.log(
    `${"Ação".padEnd(14)} ${"ID".padEnd(4)} ${"Nome".padEnd(35)} ${"Líder".padEnd(25)} ${"Cidade".padEnd(18)} Rev`
  );
  console.log("─".repeat(90));
  for (const p of preview) {
    console.log(
      `${p.action.padEnd(14)} ${p.sourceId.padEnd(4)} ${p.name.slice(0, 34).padEnd(35)} ${p.leaderName.slice(0, 24).padEnd(25)} ${p.city.slice(0, 17).padEnd(18)} ${p.review}`
    );
  }
  console.log("═".repeat(90));

  console.log(`\n📊 RESUMO:`);
  console.log(`   ➕ Criar:     ${toCreate}`);
  console.log(`   🔄 Atualizar: ${toUpdate}`);
  console.log(`   ⏭️  Preservar: ${toSkip}`);
  console.log(`   📋 Total:     ${rawCells.length}`);

  if (needsReview.length > 0) {
    console.log(`\n⚠️  REGISTROS PENDENTES DE REVISÃO (${needsReview.length}):`);
    for (const note of needsReview) {
      console.log(`   • ${note}`);
    }
  }

  console.log(`\n🎯 Coleção de destino: cells`);
  console.log(`🔑 Projeto Firebase: ${process.env.FIREBASE_PROJECT_ID}`);

  if (!confirm) {
    console.log(`\nℹ️  Modo PREVIEW. Para gravar no Firestore, execute:`);
    console.log(`   node scripts/seed-celulas.mjs --confirm\n`);
    return;
  }

  // Gravação
  console.log(`\n💾 GRAVANDO NO FIRESTORE...\n`);
  const now = FieldValue.serverTimestamp();
  const batch = db.batch();
  let batchCount = 0;
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  async function flushBatch() {
    if (batchCount > 0) {
      await batch.commit();
      console.log(`   ✅ Batch de ${batchCount} operações salvo.`);
      batchCount = 0;
    }
  }

  for (const raw of rawCells) {
    const sourceId = String(raw.sourceId);
    const citySlug = normalizeCitySlug(raw.city);
    const region = normalizeRegion(raw.region);
    const { meetingDay, meetingTime } = parseMeetingText(raw.meetingText);
    const missingCritical = !raw.city || !raw.address || !raw.leaderName;
    const isPendingReview = raw.reviewStatus === "pending" || missingCritical;

    const existing = existingBySourceId.get(sourceId);

    const payload = {
      name: raw.name,
      leaderName: raw.leaderName ?? "",
      neighborhood: raw.neighborhood ?? "",
      address: raw.address ?? "",
      dayTime: raw.meetingText ?? "",
      whatsapp: "",
      logoUrl: null,
      active: raw.active ?? true,
      published: raw.published ?? false,
      order: raw.sourceId,
      region,
      profile: raw.profile ?? null,
      city: raw.city ?? null,
      citySlug,
      sedeId: null,
      meetingDay,
      meetingTime,
      latitude: null,
      longitude: null,
      geocodeStatus: "pending",
      reviewStatus: isPendingReview ? "pending" : "unreviewed",
      addressPublic: raw.addressPublic ?? false,
      locationPublic: raw.locationPublic ?? false,
      sourceId,
      updatedAt: now,
    };

    if (existing) {
      const preserveCoords =
        existing.geocodeStatus === "verified" || existing.geocodeStatus === "manual";

      if (preserveCoords) {
        skippedCount++;
        continue;
      }

      // Atualiza sem sobrescrever coordenadas existentes
      delete payload.latitude;
      delete payload.longitude;
      delete payload.geocodeStatus;

      const ref = cellsRef.doc(existing._docId);
      batch.update(ref, payload);
      batchCount++;
      updatedCount++;
    } else {
      const ref = cellsRef.doc();
      batch.set(ref, { ...payload, createdAt: now });
      batchCount++;
      createdCount++;
    }

    // Firestore batch limite: 500 ops
    if (batchCount >= 490) {
      await flushBatch();
    }
  }

  await flushBatch();

  console.log(`\n✅ SEED CONCLUÍDO!`);
  console.log(`   Criados:     ${createdCount}`);
  console.log(`   Atualizados: ${updatedCount}`);
  console.log(`   Preservados: ${skippedCount}`);
  console.log(`   Total:       ${createdCount + updatedCount + skippedCount}\n`);
}

main().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});