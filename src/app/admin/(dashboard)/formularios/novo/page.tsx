import Link from "next/link";
import { FormBuilderClient } from "@/components/admin/forms/FormBuilderClient";

export default function NewFormPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-foreground">Novo formulário</h1>
          <p className="mt-2 text-sm text-foreground-subtle">Configure os campos, disponibilidade e limites de inscrição.</p>
        </div>
        <Link
          href="/admin/formularios"
          className="inline-flex items-center gap-2 rounded-full border border-border-soft px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          Voltar
        </Link>
      </div>

      <FormBuilderClient mode="create" />
    </div>
  );
}