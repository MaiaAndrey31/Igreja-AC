"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { socialLinksRaw } from "@/lib/firebase/collections";
import { requireAdminSession } from "@/lib/auth/session";
import { socialLinkSchema } from "@/lib/validation/schemas";
import type { ActionState } from "@/actions/auth";

function parseSocialLinkForm(formData: FormData) {
  return socialLinkSchema.safeParse({
    platform: formData.get("platform"),
    label: formData.get("label"),
    handle: formData.get("handle"),
    href: formData.get("href"),
    external: formData.get("external") === "on",
    order: formData.get("order") ?? 0,
  });
}

export async function createSocialLinkAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdminSession();
  const parsed = parseSocialLinkForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const now = FieldValue.serverTimestamp();
  await socialLinksRaw().add({ ...parsed.data, createdAt: now, updatedAt: now });
  revalidatePath("/");
  revalidatePath("/admin/redes-sociais");
  return { success: true };
}

export async function updateSocialLinkAction(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminSession();
  const parsed = parseSocialLinkForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await socialLinksRaw()
    .doc(id)
    .update({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() });
  revalidatePath("/");
  revalidatePath("/admin/redes-sociais");
  return { success: true };
}

export async function deleteSocialLinkAction(id: string): Promise<void> {
  await requireAdminSession();
  await socialLinksRaw().doc(id).delete();
  revalidatePath("/");
  revalidatePath("/admin/redes-sociais");
}
