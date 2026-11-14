"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { servicesRaw } from "@/lib/firebase/collections";
import { requireAdminSession } from "@/lib/auth/session";
import { serviceSchema } from "@/lib/validation/schemas";
import type { Weekday } from "@/lib/services";
import type { ActionState } from "@/actions/auth";

function parseServiceForm(formData: FormData) {
  const type = formData.get("type") === "one_time" ? "one_time" : "weekly";

  const raw: Record<string, unknown> = {
    type,
    time: formData.get("time"),
    label: formData.get("label") ?? "",
    order: formData.get("order") ?? 0,
  };

  if (type === "weekly") {
    raw.weekday = formData.get("weekday");
  } else {
    raw.date = formData.get("date");
  }

  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) return parsed;

  // Cast seguro: o discriminatedUnion já garantiu a forma correta.
  if (parsed.data.type === "weekly") {
    return { ...parsed, data: { ...parsed.data, weekday: parsed.data.weekday as Weekday } };
  }
  return parsed;
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
