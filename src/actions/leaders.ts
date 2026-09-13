"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { leadersCollection, leadersRaw } from "@/lib/firebase/collections";
import { requireAdminSession } from "@/lib/auth/session";
import { leaderSchema } from "@/lib/validation/schemas";
import { saveImageUpload, UploadValidationError } from "@/lib/upload";
import type { ActionState } from "@/actions/auth";

async function resolvePhotoUrl(formData: FormData, currentUrl: string): Promise<string | { error: string }> {
  const file = formData.get("photoFile");
  if (!(file instanceof File) || file.size === 0) return currentUrl;

  try {
    const result = await saveImageUpload(file);
    return result.url;
  } catch (err) {
    if (err instanceof UploadValidationError) return { error: err.message };
    console.error("Falha ao processar upload de foto de líder:", err);
    return { error: `Falha ao processar a foto: ${(err as Error).message}` };
  }
}

function parseLeaderForm(formData: FormData, photoUrl: string) {
  return leaderSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    quote: formData.get("quote") ?? "",
    photoUrl,
    active: formData.get("active") === "on",
    order: formData.get("order") ?? 0,
  });
}

export async function createLeaderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdminSession();

  const photoResult = await resolvePhotoUrl(formData, "");
  if (typeof photoResult !== "string") return photoResult;

  const parsed = parseLeaderForm(formData, photoResult);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const now = FieldValue.serverTimestamp();
  await leadersRaw().add({ ...parsed.data, createdAt: now, updatedAt: now });
  revalidatePath("/");
  revalidatePath("/sobre");
  revalidatePath("/admin/lideranca");
  return { success: true };
}

export async function updateLeaderAction(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminSession();

  const currentSnap = await leadersCollection().doc(id).get();
  if (!currentSnap.exists) return { error: "Líder não encontrado." };
  const current = currentSnap.data()!;

  const photoResult = await resolvePhotoUrl(formData, current.photoUrl ?? "");
  if (typeof photoResult !== "string") return photoResult;

  const parsed = parseLeaderForm(formData, photoResult);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await leadersRaw()
    .doc(id)
    .update({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() });
  revalidatePath("/");
  revalidatePath("/sobre");
  revalidatePath("/admin/lideranca");
  return { success: true };
}

export async function deleteLeaderAction(id: string): Promise<void> {
  await requireAdminSession();
  await leadersRaw().doc(id).delete();
  revalidatePath("/");
  revalidatePath("/sobre");
  revalidatePath("/admin/lideranca");
}
