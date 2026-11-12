import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllForms, getFormAdminCounts } from "@/lib/adminData";
import { computeEffectiveStatus } from "@/lib/forms/availability";
import { FormsListClient } from "@/components/admin/forms/FormsListClient";

export default async function AdminFormsPage() {
  let forms: Awaited<ReturnType<typeof getAllForms>> = [];
  let counts = { total: 0, active: 0, closed: 0, totalSubmissions: 0 };
  let loadError: string | null = null;

  try {
    [forms, counts] = await Promise.all([
      getAllForms(),
      getFormAdminCounts(),
    ]);
  } catch (err) {
    console.error("Erro ao carregar formulários:", err);
    loadError = "Falha ao carregar os formulários. Verifique se os índices do Firestore foram publicados.";
  }

  // Calcula status efetivo para cada formulário
  const now = new Date();
  const formsWithStatus = forms.map((form) => ({
    ...form,
    effectiveStatus: computeEffectiveStatus(
      {
        adminStatus: form.adminStatus,
        availability: form.availability,
        submissionCount: form.submissionCount,
        maxSubmissions: form.maxSubmissions,
      },
      now
    ),
  }));

  return (
    <div className="flex flex-col gap-8">
      {/* Contadores */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={counts.total} />
        <StatCard label="Ativos" value={counts.active} accent />
        <StatCard label="Encerrados" value={counts.closed} />
        <StatCard label="Respostas" value={counts.totalSubmissions} />
      </div>

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-foreground">Formulários</h1>
          <p className="mt-2 text-sm text-foreground-subtle">Crie formulários personalizados para inscrições, pesquisas e cadastros.</p>
        </div>
        <Link
          href="/admin/formularios/novo"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-background transition-colors hover:bg-accent"
        >
          <Plus size={15} />
          Novo formulário
        </Link>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
          {loadError}
        </div>
      )}

      <FormsListClient forms={formsWithStatus} />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-foreground-subtle">
        {label}
      </p>
      <p
        className={`mt-1 font-display text-2xl ${
          accent ? "text-accent" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}