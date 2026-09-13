"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { galleryCollection, galleryRaw } from "@/lib/firebase/collections";
import { requireAdminSession } from "@/lib/auth/session";
import { galleryImageSchema } from "@/lib/validation/schemas";
import { saveImageUpload, UploadValidationError } from "@/lib/upload";
import type { ActionState } from "@/actions/auth";

export async function uploadGalleryImageAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminSession();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Selecione um arquivo de imagem." };
  }

  let url: string;
  try {
    const result = await saveImageUpload(file);
    url = result.url;
  } catch (err) {
    if (err instanceof UploadValidationError) return { error: err.message };
    return { error: "Falha ao processar a imagem." };
  }

  const parsed = galleryImageSchema.safeParse({
    url,
    alt: formData.get("alt"),
    eventName: formData.get("eventName") ?? "",
    order: formData.get("order") ?? 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await galleryRaw().add({ ...parsed.data, createdAt: FieldValue.serverTimestamp() });
  revalidatePath("/galeria");
  revalidatePath("/admin/galeria");
  return { success: true };
}

export async function updateGalleryImageAction(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminSession();

  const currentSnap = await galleryCollection().doc(id).get();
  if (!currentSnap.exists) return { error: "Foto não encontrada." };
  const current = currentSnap.data()!;

  const parsed = galleryImageSchema.safeParse({
    url: current.url,
    alt: formData.get("alt"),
    eventName: formData.get("eventName") ?? "",
    order: formData.get("order") ?? current.order,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await galleryRaw().doc(id).update({ ...parsed.data });
  revalidatePath("/galeria");
  revalidatePath("/admin/galeria");
  return { success: true };
}

export async function deleteGalleryImageAction(id: string): Promise<void> {
  await requireAdminSession();
  await galleryRaw().doc(id).delete();
  revalidatePath("/galeria");
  revalidatePath("/admin/galeria");
}
