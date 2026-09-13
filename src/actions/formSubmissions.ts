"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import {
  formRateLimitDoc,
  formSubmissionsRaw,
  type FormSubmissionStatus,
} from "@/lib/firebase/collections";
import { requireAdminSession } from "@/lib/auth/session";
import { formSubmissionSchema } from "@/lib/validation/schemas";
import type { ActionState } from "@/actions/auth";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hora

/**
 * Sem sessão para checar (o formulário é público) — o melhor sinal disponível
 * é o IP de borda. Best-effort: atrás de um proxy que não define
 * `x-forwarded-for` (incomum no VPS deste projeto), o limite simplesmente não
 * se aplica, em vez de quebrar o envio.
 */
async function clientIp(): Promise<string | null> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || null;
}

async function isRateLimited(key: string): Promise<boolean> {
  const ref = formRateLimitDoc(key);
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

export async function submitFormAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = formSubmissionSchema.safeParse({
    type: formData.get("type"),
    name: formData.get("name"),
    contact: formData.get("contact"),
    message: formData.get("message") ?? "",
    honeypot: formData.get("website") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  // Bot preencheu o campo escondido: finge sucesso, não grava nada. Não avisa
  // que foi descartado — isso só ensinaria o bot a deixar o campo vazio.
  if (parsed.data.honeypot) return { success: true };

  const ip = await clientIp();
  if (ip && (await isRateLimited(`${ip}:${parsed.data.type}`))) {
    return { error: "Muitos envios em pouco tempo. Tente novamente mais tarde." };
  }

  const now = FieldValue.serverTimestamp();
  await formSubmissionsRaw().add({
    type: parsed.data.type,
    name: parsed.data.name,
    contact: parsed.data.contact,
    message: parsed.data.message || null,
    status: "novo" satisfies FormSubmissionStatus,
    createdAt: now,
    updatedAt: now,
  });

  return { success: true };
}

export async function updateSubmissionStatusAction(id: string, status: FormSubmissionStatus): Promise<void> {
  await requireAdminSession();
  await formSubmissionsRaw().doc(id).update({ status, updatedAt: FieldValue.serverTimestamp() });
  revalidatePath("/admin/contatos");
  revalidatePath("/admin");
}

export async function deleteSubmissionAction(id: string): Promise<void> {
  await requireAdminSession();
  await formSubmissionsRaw().doc(id).delete();
  revalidatePath("/admin/contatos");
  revalidatePath("/admin");
}
