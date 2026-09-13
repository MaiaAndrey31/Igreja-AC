"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { ministriesRaw } from "@/lib/firebase/collections";
import { requireAdminSession } from "@/lib/auth/session";
import { ministrySchema } from "@/lib/validation/schemas";
import type { ActionState } from "@/actions/auth";

function parseMinistryForm(formData: FormData) {
  return ministrySchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    icon: formData.get("icon"),
    highlight: formData.get("highlight") === "on",
    order: formData.get("order") ?? 0,
    published: formData.get("published") === "on",
  });
}

export async function createMinistryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminSession();
  const parsed = parseMinistryForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const now = FieldValue.serverTimestamp();
  await ministriesRaw().add({ ...parsed.data, createdAt: now, updatedAt: now });
  revalidatePath("/");
  revalidatePath("/ministerios");
  revalidatePath("/admin/ministerios");
  return { success: true };
}

export async function updateMinistryAction(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminSession();
  const parsed = parseMinistryForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await ministriesRaw()
    .doc(id)
    .update({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() });
  revalidatePath("/");
  revalidatePath("/ministerios");
  revalidatePath("/admin/ministerios");
  return { success: true };
}

export async function deleteMinistryAction(id: string): Promise<void> {
  await requireAdminSession();
  await ministriesRaw().doc(id).delete();
  revalidatePath("/");
  revalidatePath("/ministerios");
  revalidatePath("/admin/ministerios");
}
