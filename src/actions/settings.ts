"use server";

import { revalidatePath } from "next/cache";
import { siteSettingsDoc } from "@/lib/firebase/collections";
import { requireAdminSession } from "@/lib/auth/session";
import { siteSettingsSchema } from "@/lib/validation/schemas";
import { saveImageUpload, saveVideoUpload, UploadValidationError } from "@/lib/upload";
import type { ActionState } from "@/actions/auth";

export async function updateSettingsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminSession();

  const ref = siteSettingsDoc();
  const currentSnap = await ref.get();
  const current = currentSnap.exists ? currentSnap.data() : undefined;

  let heroVideoUrl = current?.heroVideoUrl ?? "/videos/hero-placeholder.mp4";
  let heroPosterUrl = current?.heroPosterUrl ?? "/videos/hero-poster.jpg";

  const videoFile = formData.get("heroVideoFile");
  if (videoFile instanceof File && videoFile.size > 0) {
    try {
      const result = await saveVideoUpload(videoFile);
      heroVideoUrl = result.url;
    } catch (err) {
      if (err instanceof UploadValidationError) return { error: err.message };
      return { error: "Falha ao processar o vídeo." };
    }
  }

  const posterFile = formData.get("heroPosterFile");
  if (posterFile instanceof File && posterFile.size > 0) {
    try {
      const result = await saveImageUpload(posterFile);
      heroPosterUrl = result.url;
    } catch (err) {
      if (err instanceof UploadValidationError) return { error: err.message };
      return { error: "Falha ao processar a imagem de capa." };
    }
  }

  const parsed = siteSettingsSchema.safeParse({
    heroMediaType: formData.get("heroMediaType"),
    heroFocusY: formData.get("heroFocusY"),
    heroVideoUrl,
    heroPosterUrl,
    heroTitle: formData.get("heroTitle"),
    heroSubtitle: formData.get("heroSubtitle"),
    donationText: formData.get("donationText"),
    pixKeyType: formData.get("pixKeyType"),
    pixKey: formData.get("pixKey"),
    bankName: formData.get("bankName"),
    bankAgency: formData.get("bankAgency"),
    bankAccount: formData.get("bankAccount"),
    bankHolder: formData.get("bankHolder"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await ref.set({ ...parsed.data, updatedAt: new Date() });

  revalidatePath("/");
  revalidatePath("/contribua");
  revalidatePath("/admin/configuracoes");
  return { success: true };
}
