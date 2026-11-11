import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormById, getFormSubmissions } from "@/lib/adminData";
import { SubmissionsTableClient } from "@/components/admin/forms/SubmissionsTableClient";

export default async function FormResponsesPage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 const { id } = await params;
 const form = await getFormById(id);
 if (!form) notFound();

 const submissions = await getFormSubmissions(id);

 return (
 <div className="flex flex-col gap-8">
 <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
 <div>
 <h1 className="font-display text-2xl tracking-wide text-foreground">Respostas: {form.title}</h1>
 <p className="mt-2 text-sm text-foreground-subtle">{submissions.length} resposta(s) recebida(s). Limite: {form.maxSubmissions ?? "ilimitado"}.</p>
 </div>
 <Link
 href="/admin/formularios"
 className="inline-flex items-center gap-2 rounded-full border border-border-soft px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
 >
 Voltar
 </Link>
 </div>

 <SubmissionsTableClient
 formId={id}
 fields={form.fields}
 submissions={submissions}
 maxSubmissions={form.maxSubmissions}
 />
 </div>
 );
}