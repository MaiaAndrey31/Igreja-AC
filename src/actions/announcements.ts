"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import type { z } from "zod";
import { announcementsCollection, announcementsRaw } from "@/lib/firebase/collections";
import { requireAdminSession } from "@/lib/auth/session";
import { announcementSchema } from "@/lib/validation/schemas";
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
    console.error("Falha ao processar upload de imagem de aviso:", err);
    return { error: `Falha ao processar a imagem: ${(err as Error).message}` };
  }
}

function parseAnnouncementForm(formData: FormData, imageUrl: string) {
  return announcementSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    imageUrl,
    instagramUrl: formData.get("instagramUrl") ?? "",
    category: formData.get("category"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    published: formData.get("published") === "on",
    // Novos campos do módulo de eventos
    visualId: formData.get("visualId") ?? "",
    groupUrl: formData.get("groupUrl") ?? "",
    confirmationMessage: formData.get("confirmationMessage") ?? "",
    // Campos de pop-up
    showAsPopup: formData.get("showAsPopup") === "on",
    popupButtonText: formData.get("popupButtonText") ?? "",
    popupButtonUrl: formData.get("popupButtonUrl") ?? "",
    popupPriority: formData.get("popupPriority") ?? "0",
    popupFrequency: formData.get("popupFrequency") ?? "session",
  });
}

/**
 * O Firestore rejeita `undefined` em `.add()`/`.update()` (o Prisma aceitava
 * e tratava como "sem alteração"/"não definido"). `endDate` é o único campo
 * opcional daqui que chega como `undefined` (data final em branco) — esta
 * função monta o payload de escrita omitindo a chave nesse caso, o que
 * reproduz o mesmo efeito nos dois SDKs: no create, o campo simplesmente não
 * é gravado; no update, o valor existente não é tocado.
 */
function toWritePayload(data: z.infer<typeof announcementSchema>) {
  const { endDate, ...rest } = data;
  return endDate ? { ...rest, endDate } : rest;
}

export async function createAnnouncementAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminSession();

  const imageResult = await resolveImageUrl(formData, "");
  if (typeof imageResult !== "string") return imageResult;

  const parsed = parseAnnouncementForm(formData, imageResult);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const now = FieldValue.serverTimestamp();
  await announcementsRaw().add({ ...toWritePayload(parsed.data), createdAt: now, updatedAt: now });
  revalidatePath("/avisos");
  revalidatePath("/");
  revalidatePath("/admin/avisos");
  return { success: true };
}

export async function updateAnnouncementAction(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminSession();

  const currentSnap = await announcementsCollection().doc(id).get();
  if (!currentSnap.exists) return { error: "Aviso não encontrado." };
  const current = currentSnap.data()!;

  const imageResult = await resolveImageUrl(formData, current.imageUrl ?? "");
  if (typeof imageResult !== "string") return imageResult;

  const parsed = parseAnnouncementForm(formData, imageResult);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await announcementsRaw()
    .doc(id)
    .update({ ...toWritePayload(parsed.data), updatedAt: FieldValue.serverTimestamp() });
  revalidatePath("/avisos");
  revalidatePath("/");
  revalidatePath("/admin/avisos");
  return { success: true };
}

export async function deleteAnnouncementAction(id: string): Promise<void> {
  await requireAdminSession();
  await announcementsRaw().doc(id).delete();
  revalidatePath("/avisos");
  revalidatePath("/");
  revalidatePath("/admin/avisos");
}
