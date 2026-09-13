"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { servicesRaw } from "@/lib/firebase/collections";
import { requireAdminSession } from "@/lib/auth/session";
import { serviceSchema } from "@/lib/validation/schemas";
import type { Weekday } from "@/lib/services";
import type { ActionState } from "@/actions/auth";

function parseServiceForm(formData: FormData) {
  const parsed = serviceSchema.safeParse({
    weekday: formData.get("weekday"),
    time: formData.get("time"),
    label: formData.get("label") ?? "",
    order: formData.get("order") ?? 0,
  });
  if (!parsed.success) return parsed;
  // `serviceSchema.weekday` já garante um inteiro 0-6 — o cast só nomeia o
  // subtipo que `Weekday` representa, sem checagem adicional em runtime.
  return { ...parsed, data: { ...parsed.data, weekday: parsed.data.weekday as Weekday } };
}

export async function createServiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdminSession();
  const parsed = parseServiceForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const now = FieldValue.serverTimestamp();
  await servicesRaw().add({ ...parsed.data, createdAt: now, updatedAt: now });
  revalidatePath("/");
  revalidatePath("/sobre");
  revalidatePath("/admin/horarios");
  return { success: true };
}

export async function updateServiceAction(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminSession();
  const parsed = parseServiceForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await servicesRaw()
    .doc(id)
    .update({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() });
  revalidatePath("/");
  revalidatePath("/sobre");
  revalidatePath("/admin/horarios");
  return { success: true };
}

export async function deleteServiceAction(id: string): Promise<void> {
  await requireAdminSession();
  await servicesRaw().doc(id).delete();
  revalidatePath("/");
  revalidatePath("/sobre");
  revalidatePath("/admin/horarios");
}
