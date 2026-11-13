"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createHash } from "node:crypto";
import { FieldValue, Transaction } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import {
  formsCollection,
  formSubmissionsDynRaw,
  dynamicFormRateLimitDoc,
} from "@/lib/firebase/collections";
import { computeEffectiveStatus } from "@/lib/forms/availability";
import { buildSubmissionSchema } from "@/lib/forms/schemas";
import type { ActionState } from "@/actions/auth";
import type { DynamicFormField } from "@/lib/forms/types";

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hora

/**
 * Hash SHA-256 do IP para evitar persistir endereços brutos no Firestore
 * (LGPD). O hash é suficiente para rate limiting e não permite reversão.
 */
async function hashedClientIp(): Promise<string | null> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

async function isRateLimited(formId: string, ipHash: string): Promise<boolean> {
  const key = `${ipHash}:${formId}`;
  const ref = dynamicFormRateLimitDoc(key);
  const snap = await ref.get();
  const now = Date.now();

  if (!snap.exists) {
    await ref.set({ count: 1, windowStartsAt: new Date(now) });
    return false;
  }

  const current = snap.data()!;
  const windowExpired = now - current.windowStartsAt.getTime() > RATE_LIMIT_WINDOW_MS;
  if (windowExpired) {
    await ref.set({ count: 1, windowStartsAt: new Date(now) });
    return false;
  }

  if (current.count >= RATE_LIMIT_MAX) return true;

  await ref.set({ count: current.count + 1, windowStartsAt: current.windowStartsAt });
  return false;
}

/**
 * Submissão pública de formulário dinâmico.
 *
 * Fluxo:
 * 1. Carrega o formulário pelo slug (publicado).
 * 2. Verifica disponibilidade efetiva no servidor.
 * 3. Valida honeypot.
 * 4. Rate limit por IP hash + formId.
 * 5. Valida respostas contra o schema da versão publicada.
 * 6. Transação atômica: verifica limite de vagas + grava submissão + incrementa contador.
 */
export async function submitDynamicFormAction(
  slug: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  // 1. Carregar formulário
  const formSnap = await formsCollection()
    .where("slug", "==", slug)
    .where("adminStatus", "==", "published")
    .limit(1)
    .get();

  if (formSnap.empty) return { error: "Formulário não encontrado." };
  const form = formSnap.docs[0].data();
  const formId = formSnap.docs[0].id;

  // 2. Disponibilidade efetiva
  const effectiveStatus = computeEffectiveStatus({
    adminStatus: form.adminStatus,
    availability: form.availability,
    submissionCount: form.submissionCount,
    maxSubmissions: form.maxSubmissions,
  });

  if (effectiveStatus !== "open") {
    const messages: Record<string, string> = {
      draft: "Este formulário não está disponível.",
      not_yet_open: "As inscrições ainda não foram abertas.",
      closed_by_schedule: "As inscrições foram encerradas.",
      closed_by_duration: "O prazo de inscrição expirou.",
      closed_manually: "As inscrições foram encerradas.",
      full: "Todas as vagas foram preenchidas.",
      archived: "Este formulário foi arquivado.",
    };
    return { error: messages[effectiveStatus] ?? "Formulário indisponível." };
  }

  // 3. Honeypot
  const honeypot = formData.get("website");
  if (honeypot && typeof honeypot === "string" && honeypot.length > 0) {
    // Bot detectado: finge sucesso sem gravar nada
    return { success: true };
  }

  // 4. Rate limit
  const ipHash = await hashedClientIp();
  if (ipHash && (await isRateLimited(formId, ipHash))) {
    return { error: "Muitos envios em pouco tempo. Tente novamente mais tarde." };
  }

  // 5. Validar respostas contra o snapshot publicado
  const fields: DynamicFormField[] = form.publishedFieldsSnapshot ?? form.fields;
  const submissionSchema = buildSubmissionSchema(fields);

  const answers: Record<string, unknown> = {};
  for (const field of fields) {
    const value = formData.get(field.id);
    if (field.type === "multiselect") {
      // Múltipla escolha chega como múltiplos valores
      answers[field.id] = formData.getAll(field.id);
    } else if (field.type === "boolean" || field.type === "consent") {
      answers[field.id] = value === "on" || value === "true";
    } else {
      answers[field.id] = value ?? "";
    }
  }

  const parsed = submissionSchema.safeParse(answers);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  // Extrair URLs de arquivos das respostas validadas
  const files: Record<string, string> = {};
  for (const field of fields) {
    if (field.type === "file" && parsed.data[field.id]) {
      files[field.id] = parsed.data[field.id] as string;
    }
  }

  // 6. Transação atômica: verificar vagas + gravar + incrementar
  try {
    await db().runTransaction(async (transaction: Transaction) => {
      const formRef = formsCollection().doc(formId);
      const freshSnap = await transaction.get(formRef);

      if (!freshSnap.exists) throw new Error("Formulário removido.");
      const freshForm = freshSnap.data()!;

      // Re-verificar disponibilidade dentro da transação
      const freshStatus = computeEffectiveStatus({
        adminStatus: freshForm.adminStatus,
        availability: freshForm.availability,
        submissionCount: freshForm.submissionCount,
        maxSubmissions: freshForm.maxSubmissions,
      });

      if (freshStatus !== "open") {
        throw new Error("Formulário não aceita mais inscrições.");
      }

      // Gravar submissão na subcoleção
      const submissionRef = formSubmissionsDynRaw(formId).doc();
      transaction.set(submissionRef, {
        formId,
        schemaVersion: freshForm.schemaVersion,
        answers: parsed.data,
        files,
        status: "confirmed",
        createdAt: FieldValue.serverTimestamp(),
      });

      // Incrementar contador atomicamente
      transaction.update(formRef, {
        submissionCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (err) {
    const message = (err as Error).message;
    if (message.includes("não aceita mais") || message.includes("removido")) {
      return { error: message };
    }
    console.error("Erro na transação de submissão:", err);
    return { error: "Falha ao processar a inscrição. Tente novamente." };
  }

  revalidatePath(`/formularios/${slug}`);
  return { success: true };
}

/**
 * Exclusão administrativa de submissão — libera vaga se aplicável.
 */
export async function deleteDynamicSubmissionAction(
  formId: string,
  submissionId: string
): Promise<void> {
  const { requireAdminSession } = await import("@/lib/auth/session");
  await requireAdminSession();

  // Exclui a submissão e decrementa o contador em transação
  await db().runTransaction(async (transaction: Transaction) => {
    const subRef = formSubmissionsDynRaw(formId).doc(submissionId);
    const formRef = formsCollection().doc(formId);

    const subSnap = await transaction.get(subRef);
    if (!subSnap.exists) return; // já excluída

    // Só decrementa se a submissão estava confirmada
    const subData = subSnap.data()!;
    if (subData.status === "confirmed") {
      transaction.update(formRef, {
        submissionCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.delete(subRef);
  });

  revalidatePath(`/admin/formularios/${formId}/respostas`);
}

/**
 * Cancelamento de submissão pelo próprio participante (futuro) ou admin.
 * Libera a vaga sem excluir os dados (mantém histórico).
 */
export async function cancelDynamicSubmissionAction(
  formId: string,
  submissionId: string
): Promise<ActionState> {
  const { requireAdminSession } = await import("@/lib/auth/session");
  await requireAdminSession();

  await db().runTransaction(async (transaction: Transaction) => {
    const subRef = formSubmissionsDynRaw(formId).doc(submissionId);
    const formRef = formsCollection().doc(formId);

    const subSnap = await transaction.get(subRef);
    if (!subSnap.exists) throw new Error("Inscrição não encontrada.");

    const subData = subSnap.data()!;
    if (subData.status !== "confirmed") return; // já cancelada

    transaction.update(subRef, { status: "cancelled" });
    transaction.update(formRef, {
      submissionCount: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  revalidatePath(`/admin/formularios/${formId}/respostas`);
  return { success: true };
}

/**
 * Exportação de submissões em CSV.
 * Retorna o conteúdo do arquivo como string para download no client.
 */
export async function exportSubmissionsCsvAction(
  formId: string
): Promise<{ csv: string; filename: string } | { error: string }> {
  const { requireAdminSession } = await import("@/lib/auth/session");
  await requireAdminSession();

  const formSnap = await formsCollection().doc(formId).get();
  if (!formSnap.exists) return { error: "Formulário não encontrado." };
  const form = formSnap.data()!;

  const submissionsSnap = await formSubmissionsDynRaw(formId)
    .orderBy("createdAt", "desc")
    .get();

  if (submissionsSnap.empty) return { error: "Nenhuma resposta para exportar." };

  // Usa os campos da versão atual do formulário para gerar colunas
  const fields = form.fields;

  // Cabeçalho
  const headerCols = [
    "ID",
    "Status",
    "Data de envio",
    ...fields.map((f) => escapeCsv(f.label)),
  ];

  const rows: string[] = [headerCols.join(",")];

  for (const doc of submissionsSnap.docs) {
    const data = doc.data();
    const answers = (data.answers ?? {}) as Record<string, unknown>;
    const cols = [
      doc.id,
      data.status ?? "confirmed",
      data.createdAt instanceof Date
        ? data.createdAt.toISOString()
        : String(data.createdAt ?? ""),
      ...fields.map((f) => {
        const val = answers[f.id];
        if (val == null) return "";
        if (Array.isArray(val)) return escapeCsv(val.join("; "));
        return escapeCsv(String(val));
      }),
    ];
    rows.push(cols.join(","));
  }

  const safeTitle = form.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
  const dateStr = new Date().toISOString().slice(0, 10);

  return {
    csv: "﻿" + rows.join("\n"), // BOM UTF-8 para Excel
    filename: `${safeTitle}_${dateStr}.csv`,
  };
}

/**
 * Proteção contra CSV injection: prefixa células que começam com caracteres
 * perigosos (=, +, -, @, \t, \r) com um apóstrofo simples.
 */
function escapeCsv(value: string): string {
  const dangerous = /^[=+\-@\t\r]/;
  const escaped = value.replace(/"/g, '""');
  const prefixed = dangerous.test(escaped) ? `'${escaped}` : escaped;
  return `"${prefixed}"`;
}

// ---------------------------------------------------------------------------
// Exportação XML
// ---------------------------------------------------------------------------

/** Escapa caracteres especiais para XML válido. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Formata valor de resposta para texto legível em XML. */
function formatXmlAnswer(field: DynamicFormField, value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join("; ");
  if (field.type === "boolean" || field.type === "consent") {
    return value ? "Sim" : "Não";
  }
  return String(value);
}

/**
 * Exportação de submissões em formato XML.
 * Retorna o conteúdo do arquivo como string para download no client.
 */
export async function exportSubmissionsXmlAction(
  formId: string
): Promise<{ xml: string; filename: string } | { error: string }> {
  const { requireAdminSession } = await import("@/lib/auth/session");
  await requireAdminSession();

  const formSnap = await formsCollection().doc(formId).get();
  if (!formSnap.exists) return { error: "Formulário não encontrado." };
  const form = formSnap.data()!;

  const submissionsSnap = await formSubmissionsDynRaw(formId)
    .orderBy("createdAt", "desc")
    .get();

  if (submissionsSnap.empty) return { error: "Nenhuma resposta para exportar." };

  const fields = form.fields;
  const now = new Date().toISOString();

  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<exportacao formulario="${escapeXml(form.title)}" data="${now}" total="${submissionsSnap.size}">`,
  ];

  for (const doc of submissionsSnap.docs) {
    const data = doc.data();
    const answers = (data.answers ?? {}) as Record<string, unknown>;
    const createdAt =
      data.createdAt instanceof Date
        ? data.createdAt.toISOString()
        : String(data.createdAt ?? "");

    lines.push(`  <resposta id="${doc.id}">`);
    lines.push(`    <status>${escapeXml(data.status ?? "confirmed")}</status>`);
    lines.push(`    <data_envio>${escapeXml(createdAt)}</data_envio>`);

    if (form.eventRef) {
      lines.push(`    <evento_ref>${escapeXml(form.eventRef)}</evento_ref>`);
    }

    lines.push("    <campos>");
    for (const field of fields) {
      const val = formatXmlAnswer(field, answers[field.id]);
      lines.push(
        `      <campo nome="${escapeXml(field.label)}" tipo="${field.type}">${escapeXml(val)}</campo>`
      );
    }
    lines.push("    </campos>");
    lines.push("  </resposta>");
  }

  lines.push("</exportacao>");

  const safeTitle = form.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
  const dateStr = new Date().toISOString().slice(0, 10);

  return {
    xml: lines.join("\n"),
    filename: `${safeTitle}_${dateStr}.xml`,
  };
}

// ---------------------------------------------------------------------------
// Exportação PDF (HTML para renderização no cliente via window.print ou iframe)
// ---------------------------------------------------------------------------

/**
 * Exportação de submissões em formato HTML otimizado para impressão/PDF.
 * O cliente converte para PDF via window.print() ou iframe, evitando
 * dependências pesadas de geração de PDF no servidor (compatível com Vercel).
 *
 * Retorna HTML completo com estilos inline para impressão fiel.
 */
export async function exportSubmissionsPdfHtmlAction(
  formId: string,
  options?: { submissionId?: string }
): Promise<{ html: string; filename: string } | { error: string }> {
  const { requireAdminSession } = await import("@/lib/auth/session");
  await requireAdminSession();

  const formSnap = await formsCollection().doc(formId).get();
  if (!formSnap.exists) return { error: "Formulário não encontrado." };
  const form = formSnap.data()!;

  let submissionsSnap;
  if (options?.submissionId) {
    // PDF individual
    const docSnap = await formSubmissionsDynRaw(formId).doc(options.submissionId).get();
    if (!docSnap.exists) return { error: "Resposta não encontrada." };
    submissionsSnap = { docs: [docSnap], empty: false, size: 1 };
  } else {
    // PDF consolidado
    submissionsSnap = await formSubmissionsDynRaw(formId)
      .orderBy("createdAt", "desc")
      .get();
  }

  if (submissionsSnap.empty) return { error: "Nenhuma resposta para exportar." };

  const fields = form.fields;
  const now = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isIndividual = !!options?.submissionId;

  function formatDate(date: Date | unknown): string {
    if (date instanceof Date) {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return String(date ?? "");
  }

  function formatAnswerHtml(field: DynamicFormField, value: unknown): string {
    if (value == null) return "<em>Não informado</em>";
    if (Array.isArray(value)) return escapeXml(value.join(", "));
    if (field.type === "boolean" || field.type === "consent") {
      return value ? "Sim" : "Não";
    }
    if (field.type === "file") {
      const url = String(value);
      return url ? `<a href="${escapeXml(url)}">Arquivo anexado</a>` : "<em>Sem arquivo</em>";
    }
    return escapeXml(String(value));
  }

  // Gera HTML com estilos inline para impressão
  const responsesHtml = submissionsSnap.docs.map((doc) => {
    const data = doc.data();
    if (!data) return "";
    const answers = (data.answers ?? {}) as Record<string, unknown>;
    const statusLabel = data.status === "confirmed" ? "Confirmada" : "Cancelada";
    const statusColor = data.status === "confirmed" ? "#16a34a" : "#dc2626";

    const fieldsHtml = fields
      .map(
        (f) => `
        <div class="field">
          <span class="label">${escapeXml(f.label)}</span>
          <span class="value">${formatAnswerHtml(f, answers[f.id])}</span>
        </div>`
      )
      .join("");

    return `
      <div class="response">
        <div class="response-header">
          <span class="status" style="color: ${statusColor}">${statusLabel}</span>
          <span class="date">${formatDate(data.createdAt)}</span>
        </div>
        <div class="fields">${fieldsHtml}</div>
      </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${escapeXml(form.title)} — Respostas</title>
  <style>
    @page { margin: 2cm; size: A4; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a; line-height: 1.5; padding: 0; }
    .header { text-align: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid #1a1a1a; }
    .header h1 { font-size: 1.5rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
    .header .meta { font-size: 0.85rem; color: #666; }
    .summary { margin-bottom: 1.5rem; font-size: 0.9rem; color: #444; }
    .response { page-break-inside: avoid; margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #ddd; border-radius: 4px; }
    .response-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid #eee; font-size: 0.85rem; }
    .status { font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
    .field { display: flex; gap: 0.5rem; margin-bottom: 0.4rem; font-size: 0.9rem; }
    .label { font-weight: 600; min-width: 180px; color: #333; flex-shrink: 0; }
    .value { color: #1a1a1a; word-break: break-word; }
    .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ddd; text-align: center; font-size: 0.75rem; color: #999; }
    @media print {
      body { padding: 0; }
      .response { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeXml(form.title)}</h1>
    <div class="meta">Relatório gerado em ${now}</div>
  </div>
  <div class="summary">
    <strong>Total de respostas:</strong> ${submissionsSnap.size}
    ${form.maxSubmissions ? ` | <strong>Vagas:</strong> ${form.maxSubmissions}` : ""}
    ${form.eventRef ? ` | <strong>Evento vinculado:</strong> ${escapeXml(form.eventRef)}` : ""}
    ${isIndividual ? " | <strong>Tipo:</strong> Resposta individual" : " | <strong>Tipo:</strong> Relatório consolidado"}
  </div>
  ${responsesHtml}
  <div class="footer">Igreja Amor & Cuidado — Documento gerado automaticamente</div>
</body>
</html>`;

  const safeTitle = form.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
  const dateStr = new Date().toISOString().slice(0, 10);
  const suffix = isIndividual ? "individual" : "consolidado";

  return {
    html,
    filename: `${safeTitle}_${dateStr}_${suffix}.html`,
  };
}