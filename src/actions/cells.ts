"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { cellsCollection, cellsRaw } from "@/lib/firebase/collections";
import { requireAdminSession } from "@/lib/auth/session";
import { cellSchema } from "@/lib/validation/schemas";
import { saveImageUpload, UploadValidationError } from "@/lib/upload";
import type { ActionState } from "@/actions/auth";

async function resolveLogoUrl(formData: FormData, currentUrl: string): Promise<string | { error: string }> {
  const file = formData.get("logoFile");
  if (!(file instanceof File) || file.size === 0) return currentUrl;

  try {
    const result = await saveImageUpload(file);
    return result.url;
  } catch (err) {
    if (err instanceof UploadValidationError) return { error: err.message };
    console.error("Falha ao processar upload de logo de célula:", err);
    return { error: `Falha ao processar a imagem da célula: ${(err as Error).message}` };
  }
}

function parseCellForm(formData: FormData, logoUrl: string) {
  return cellSchema.safeParse({
    name: formData.get("name"),
    leaderName: formData.get("leaderName"),
    neighborhood: formData.get("neighborhood"),
    address: formData.get("address"),
    dayTime: formData.get("dayTime"),
    whatsapp: formData.get("whatsapp"),
    logoUrl,
    active: formData.get("active") === "on",
    order: formData.get("order") ?? 0,
  });
}

export async function createCellAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdminSession();

  const logoResult = await resolveLogoUrl(formData, "");
  if (typeof logoResult !== "string") return logoResult;

  const parsed = parseCellForm(formData, logoResult);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const now = FieldValue.serverTimestamp();
  await cellsRaw().add({ ...parsed.data, createdAt: now, updatedAt: now });
  revalidatePath("/celulas");
  revalidatePath("/admin/celulas");
  return { success: true };
}

export async function updateCellAction(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminSession();

  const currentSnap = await cellsCollection().doc(id).get();
  if (!currentSnap.exists) return { error: "Célula não encontrada." };
  const current = currentSnap.data()!;

  const logoResult = await resolveLogoUrl(formData, current.logoUrl ?? "");
  if (typeof logoResult !== "string") return logoResult;

  const parsed = parseCellForm(formData, logoResult);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await cellsRaw()
    .doc(id)
    .update({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() });
  revalidatePath("/celulas");
  revalidatePath("/admin/celulas");
  return { success: true };
}

export async function deleteCellAction(id: string): Promise<void> {
  await requireAdminSession();
  await cellsRaw().doc(id).delete();
  revalidatePath("/celulas");
  revalidatePath("/admin/celulas");
}
