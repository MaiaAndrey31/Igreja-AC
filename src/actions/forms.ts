"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { formsCollection, formsRaw } from "@/lib/firebase/collections";
import { requireAdminSession } from "@/lib/auth/session";
import { dynamicFormSchemaWithRefinements } from "@/lib/forms/schemas";
import type { ActionState } from "@/actions/auth";
import type { AvailabilityConfig, DynamicFormField } from "@/lib/forms/types";
import { randomUUID } from "node:crypto";

/**
 * Gera IDs estáveis para campos que não possuem um (novos campos adicionados
 * pelo construtor). Campos existentes mantêm seus IDs originais.
 */
function ensureFieldIds(fields: DynamicFormField[]): DynamicFormField[] {
 return fields.map((field) => ({
 ...field,
 id: field.id || randomUUID(),
 }));
}

function buildAvailability(data: {
 availabilityMode: string;
 opensAt?: Date | null;
 closesAt?: Date | null;
 durationHours?: number | null;
}): AvailabilityConfig {
 const mode = data.availabilityMode as AvailabilityConfig["mode"];
 return {
 mode,
 opensAt: mode === "scheduled" ? data.opensAt ?? null : null,
 closesAt: mode === "scheduled" ? data.closesAt ?? null : null,
 durationHours: mode === "duration" ? data.durationHours ?? null : null,
 activatedAt: null, // será definido ao ativar manualmente
 };
}

export async function createFormAction(
 _prev: ActionState,
 formData: FormData
): Promise<ActionState> {
 await requireAdminSession();

 const rawFields = formData.get("fields");
 let fields: DynamicFormField[] = [];
 if (typeof rawFields === "string") {
 try {
 fields = JSON.parse(rawFields);
 } catch {
 return { error: "Estrutura de campos inválida." };
 }
 }

 const parsed = dynamicFormSchemaWithRefinements.safeParse({
 title: formData.get("title"),
 description: formData.get("description") ?? "",
 slug: formData.get("slug"),
 purpose: formData.get("purpose"),
 fields: ensureFieldIds(fields),
 availabilityMode: formData.get("availabilityMode"),
 opensAt: formData.get("opensAt") || undefined,
 closesAt: formData.get("closesAt") || undefined,
 durationHours: formData.get("durationHours") || undefined,
 maxSubmissions: formData.get("maxSubmissions") || undefined,
 showRemainingSlots: formData.get("showRemainingSlots") === "on",
 eventRef: formData.get("eventRef") ?? "",
 });

 if (!parsed.success) return { error: parsed.error.issues[0]?.message };

 const now = FieldValue.serverTimestamp();
 await formsRaw().add({
 title: parsed.data.title,
 description: parsed.data.description,
 slug: parsed.data.slug,
 purpose: parsed.data.purpose,
 fields: parsed.data.fields,
 schemaVersion: 1,
 publishedFieldsSnapshot: null,
 availability: buildAvailability(parsed.data),
 adminStatus: "draft" as const,
 maxSubmissions: parsed.data.maxSubmissions ?? null,
 submissionCount: 0,
 showRemainingSlots: parsed.data.showRemainingSlots,
 eventRef: parsed.data.eventRef || null,
 createdAt: now,
 updatedAt: now,
 });

 revalidatePath("/admin/formularios");
 return { success: true };
}

export async function updateFormAction(
 id: string,
 _prev: ActionState,
 formData: FormData
): Promise<ActionState> {
 await requireAdminSession();

 const currentSnap = await formsCollection().doc(id).get();
 if (!currentSnap.exists) return { error: "Formulário não encontrado." };
 const current = currentSnap.data()!;

 const rawFields = formData.get("fields");
 let fields: DynamicFormField[] = [];
 if (typeof rawFields === "string") {
 try {
 fields = JSON.parse(rawFields);
 } catch {
 return { error: "Estrutura de campos inválida." };
 }
 }

 const parsed = dynamicFormSchemaWithRefinements.safeParse({
 title: formData.get("title"),
 description: formData.get("description") ?? "",
 slug: formData.get("slug"),
 purpose: formData.get("purpose"),
 fields: ensureFieldIds(fields),
 availabilityMode: formData.get("availabilityMode"),
 opensAt: formData.get("opensAt") || undefined,
 closesAt: formData.get("closesAt") || undefined,
 durationHours: formData.get("durationHours") || undefined,
 maxSubmissions: formData.get("maxSubmissions") || undefined,
 showRemainingSlots: formData.get("showRemainingSlots") === "on",
 eventRef: formData.get("eventRef") ?? "",
 });

 if (!parsed.success) return { error: parsed.error.issues[0]?.message };

 // Versionamento: se os campos mudaram estruturalmente e o formulário já
 // foi publicado com respostas, incrementa a versão e preserva o snapshot.
 const fieldsChanged =
 JSON.stringify(current.fields.map((f) => ({ id: f.id, type: f.type }))) !==
 JSON.stringify(parsed.data.fields.map((f) => ({ id: f.id, type: f.type })));

 const hasSubmissions = current.submissionCount > 0;
 const wasPublished = current.adminStatus === "published";

 let newVersion = current.schemaVersion;
 let newSnapshot = current.publishedFieldsSnapshot;

 if (fieldsChanged && wasPublished && hasSubmissions) {
 newVersion = current.schemaVersion + 1;
 // Snapshot da versão ANTERIOR é preservado; o novo snapshot será criado
 // quando o formulário for republicado.
 }

 // Se está publicando agora (ou republicando), atualiza o snapshot
 const isPublishing = formData.get("publish") === "true";
 if (isPublishing) {
 newSnapshot = [...parsed.data.fields];
 }

 const now = FieldValue.serverTimestamp();
 await formsRaw().doc(id).update({
 title: parsed.data.title,
 description: parsed.data.description,
 slug: parsed.data.slug,
 purpose: parsed.data.purpose,
 fields: parsed.data.fields,
 schemaVersion: newVersion,
 publishedFieldsSnapshot: newSnapshot,
 availability: buildAvailability(parsed.data),
 maxSubmissions: parsed.data.maxSubmissions ?? null,
 showRemainingSlots: parsed.data.showRemainingSlots,
 eventRef: parsed.data.eventRef || null,
 ...(isPublishing ? { adminStatus: "published" } : {}),
 updatedAt: now,
 });

 revalidatePath("/admin/formularios");
 revalidatePath(`/admin/formularios/${id}/editar`);
 return { success: true };
}

export async function deleteFormAction(id: string): Promise<void> {
 await requireAdminSession();
 // Exclui submissões primeiro (subcoleção)
 const submissionsSnap = await formsRaw()
 .doc(id)
 .collection("submissions")
 .get();
 const batch = formsRaw().firestore.batch();
 for (const doc of submissionsSnap.docs) {
 batch.delete(doc.ref);
 }
 batch.delete(formsRaw().doc(id));
 await batch.commit();

 revalidatePath("/admin/formularios");
}

export async function duplicateFormAction(id: string): Promise<ActionState> {
 await requireAdminSession();

 const snap = await formsCollection().doc(id).get();
 if (!snap.exists) return { error: "Formulário não encontrado." };
 const original = snap.data()!;

 const now = FieldValue.serverTimestamp();
 await formsRaw().add({
 title: `${original.title} (cópia)`,
 description: original.description,
 slug: `${original.slug}-copia-${Date.now()}`,
 purpose: original.purpose,
 fields: original.fields,
 schemaVersion: 1,
 publishedFieldsSnapshot: null,
 availability: { ...original.availability, activatedAt: null },
 adminStatus: "draft" as const,
 maxSubmissions: original.maxSubmissions,
 submissionCount: 0,
 showRemainingSlots: original.showRemainingSlots,
 eventRef: original.eventRef,
 createdAt: now,
 updatedAt: now,
 });

 revalidatePath("/admin/formularios");
 return { success: true };
}

export async function toggleFormStatusAction(
 id: string,
 newStatus: "published" | "draft" | "archived"
): Promise<ActionState> {
 await requireAdminSession();

 const snap = await formsCollection().doc(id).get();
 if (!snap.exists) return { error: "Formulário não encontrado." };

 const updateData: Record<string, unknown> = {
 adminStatus: newStatus,
 updatedAt: FieldValue.serverTimestamp(),
 };

 // Ao publicar, cria/atualiza o snapshot dos campos
 if (newStatus === "published") {
 const current = snap.data()!;
 updateData.publishedFieldsSnapshot = [...current.fields];
 }

 // Ao ativar manualmente, registra o momento de ativação
 if (newStatus === "published") {
 const current = snap.data()!;
 if (
 current.availability.mode === "manual" ||
 current.availability.mode === "duration"
 ) {
 if (!current.availability.activatedAt) {
 updateData["availability.activatedAt"] = FieldValue.serverTimestamp();
 }
 }
 }

 await formsRaw().doc(id).update(updateData);

 revalidatePath("/admin/formularios");
 revalidatePath(`/formularios/${snap.data()!.slug}`);
 return { success: true };
}

export async function activateFormManuallyAction(
 id: string
): Promise<ActionState> {
 await requireAdminSession();

 const snap = await formsCollection().doc(id).get();
 if (!snap.exists) return { error: "Formulário não encontrado." };

 await formsRaw().doc(id).update({
 "availability.activatedAt": FieldValue.serverTimestamp(),
 updatedAt: FieldValue.serverTimestamp(),
 });

 revalidatePath("/admin/formularios");
 return { success: true };
}

export async function closeFormManuallyAction(
 id: string
): Promise<ActionState> {
 await requireAdminSession();

 const snap = await formsCollection().doc(id).get();
 if (!snap.exists) return { error: "Formulário não encontrado." };

 // Define closesAt como agora para encerrar imediatamente
 await formsRaw().doc(id).update({
 "availability.closesAt": FieldValue.serverTimestamp(),
 updatedAt: FieldValue.serverTimestamp(),
 });

 revalidatePath("/admin/formularios");
 return { success: true };
}