"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import type { z } from "zod";
import { announcementsCollection, announcementsRaw } from "@/lib/firebase/collections";
import { requireAdminSession } from "@/lib/auth/session";
import { eventSchema } from "@/lib/validation/schemas";
import { saveImageUpload, UploadValidationError } from "@/lib/upload";
import type { ActionState } from "@/actions/auth";

async function resolveImageUrl(formData: FormData, currentUrl: string): Promise<string | { error: string }> {
  const file = formData.get("imageFile");
  if (!(file instanceof File) || file.size === 0) return currentUrl;
  try {
    const result = await saveImageUpload(file);
    return result.url;
  } catch (err) {
    if (err instanceof UploadValidationError) return { error: err.message };
    console.error("Falha ao processar upload de imagem de evento:", err);
    return { error: `Falha ao processar a imagem: ${(err as Error).message}` };
  }
}

function parseEventForm(formData: FormData, imageUrl: string) {
  return eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    imageUrl,
    category: formData.get("category"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    published: formData.get("published") === "on",
    featured: formData.get("featured") === "on",
    slug: formData.get("slug") ?? "",
    address: formData.get("address") ?? "",
    formId: formData.get("formId") ?? "",
    maxSubmissions: formData.get("maxSubmissions") ?? "",
    visualId: formData.get("visualId") ?? "",
    groupUrl: formData.get("groupUrl") ?? "",
    confirmationMessage: formData.get("confirmationMessage") ?? "",
    instagramUrl: formData.get("instagramUrl") ?? "",
  });
}

/**
 * O Firestore rejeita `undefined` em `.add()`/`.update()`. Campos opcionais
 * que chegam como `undefined` são omitidos do payload de escrita.
 */
function toWritePayload(data: z.infer<typeof eventSchema>) {
  const { endDate, maxSubmissions, ...rest } = data;
  const payload: Record<string, unknown> = { ...rest, type: "event" };
  if (endDate) payload.endDate = endDate;
  if (maxSubmissions !== null && maxSubmissions !== undefined) {
    payload.maxSubmissions = maxSubmissions;
  } else {
    payload.maxSubmissions = null;
  }
  return payload;
}

export async function createEventAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminSession();

  const imageResult = await resolveImageUrl(formData, "");
  if (typeof imageResult !== "string") return imageResult;

  const parsed = parseEventForm(formData, imageResult);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const now = FieldValue.serverTimestamp();
  await announcementsRaw().add({
    ...toWritePayload(parsed.data),
    submissionCount: 0,
    scheduledMessages: [],
    createdAt: now,
    updatedAt: now,
  });
  revalidatePath("/eventos");
  revalidatePath("/");
  revalidatePath("/admin/eventos");
  return { success: true };
}

export async function updateEventAction(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminSession();

  const currentSnap = await announcementsCollection().doc(id).get();
  if (!currentSnap.exists) return { error: "Evento não encontrado." };
  const current = currentSnap.data()!;

  const imageResult = await resolveImageUrl(formData, current.imageUrl ?? "");
  if (typeof imageResult !== "string") return imageResult;

  const parsed = parseEventForm(formData, imageResult);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await announcementsRaw()
    .doc(id)
    .update({ ...toWritePayload(parsed.data), updatedAt: FieldValue.serverTimestamp() });
  revalidatePath("/eventos");
  revalidatePath("/");
  revalidatePath("/admin/eventos");
  return { success: true };
}

export async function deleteEventAction(id: string): Promise<void> {
  await requireAdminSession();
  await announcementsRaw().doc(id).delete();
  revalidatePath("/eventos");
  revalidatePath("/");
  revalidatePath("/admin/eventos");
}

export async function duplicateEventAction(id: string): Promise<ActionState> {
  await requireAdminSession();

  const snap = await announcementsCollection().doc(id).get();
  if (!snap.exists) return { error: "Evento não encontrado." };
  const original = snap.data()!;

  const now = FieldValue.serverTimestamp();
  await announcementsRaw().add({
    ...original,
    id: undefined,
    title: `${original.title} (cópia)`,
    slug: original.slug ? `${original.slug}-copia` : null,
    published: false,
    featured: false,
    submissionCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  revalidatePath("/admin/eventos");
  return { success: true };
}