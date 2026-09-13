"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { messagesRaw } from "@/lib/firebase/collections";
import { requireAdminSession } from "@/lib/auth/session";
import { messageSchema } from "@/lib/validation/schemas";
import type { ActionState } from "@/actions/auth";

function parseMessageForm(formData: FormData) {
  return messageSchema.safeParse({
    title: formData.get("title"),
    speaker: formData.get("speaker"),
    date: formData.get("date"),
    youtubeId: formData.get("youtubeId"),
    published: formData.get("published") === "on",
    order: formData.get("order") ?? 0,
  });
}

export async function createMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdminSession();
  const parsed = parseMessageForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const now = FieldValue.serverTimestamp();
  await messagesRaw().add({ ...parsed.data, createdAt: now, updatedAt: now });
  revalidatePath("/");
  revalidatePath("/mensagens");
  revalidatePath("/admin/mensagens");
  return { success: true };
}

export async function updateMessageAction(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminSession();
  const parsed = parseMessageForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await messagesRaw()
    .doc(id)
    .update({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() });
  revalidatePath("/");
  revalidatePath("/mensagens");
  revalidatePath("/admin/mensagens");
  return { success: true };
}

export async function deleteMessageAction(id: string): Promise<void> {
  await requireAdminSession();
  await messagesRaw().doc(id).delete();
  revalidatePath("/");
  revalidatePath("/mensagens");
  revalidatePath("/admin/mensagens");
}
