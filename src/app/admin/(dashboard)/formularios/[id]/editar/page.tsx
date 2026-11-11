import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormById } from "@/lib/adminData";
import { FormBuilderClient } from "@/components/admin/forms/FormBuilderClient";

export default async function EditFormPage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 const { id } = await params;
 const form = await getFormById(id);
 if (!form) notFound();

 // Converte datas para formato datetime-local (YYYY-MM-DDTHH:mm)
 function toDateTimeLocal(date: Date | null | undefined): string {
 if (!date) return "";
 const d = new Date(date);
 const offset = d.getTimezoneOffset() * 60000;
 const local = new Date(d.getTime() - offset);
 return local.toISOString().slice(0, 16);
 }

 const initialData = {
 title: form.title,
 description: form.description,
 slug: form.slug,
 purpose: form.purpose,
 fields: form.fields,
 availabilityMode: form.availability.mode,
 opensAt: toDateTimeLocal(form.availability.opensAt),
 closesAt: toDateTimeLocal(form.availability.closesAt),
 durationHours: form.availability.durationHours ?? null,
 maxSubmissions: form.maxSubmissions,
 showRemainingSlots: form.showRemainingSlots,
 eventRef: form.eventRef ?? "",
 };

 return (
 <div className="flex flex-col gap-8">
 <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
 <div>
 <h1 className="font-display text-2xl tracking-wide text-foreground">Editar: {form.title}</h1>
 <p className="mt-2 text-sm text-foreground-subtle">Altere campos, disponibilidade e limites. Mudanças estruturais geram nova versão.</p>
 </div>
 <Link
 href="/admin/formularios"
 className="inline-flex items-center gap-2 rounded-full border border-border-soft px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
 >
 Voltar
 </Link>
 </div>

 <FormBuilderClient mode="edit" formId={id} initialData={initialData} />
 </div>
 );
}