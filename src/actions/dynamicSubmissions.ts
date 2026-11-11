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