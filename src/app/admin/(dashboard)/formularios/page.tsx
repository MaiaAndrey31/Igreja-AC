import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllForms, getFormAdminCounts } from "@/lib/adminData";
import { computeEffectiveStatus } from "@/lib/forms/availability";
import { FormsListClient } from "@/components/admin/forms/FormsListClient";
import type { DynamicForm, FormEffectiveStatus } from "@/lib/forms/types";

/**
 * Serializa valores de data para strings ISO 8601, garantindo compatibilidade
 * com a passagem de dados entre Server Components e Client Components.
 *
 * O React Server Components não suporta instâncias de Firestore Timestamp
 * (objetos com _seconds/_nanoseconds) nem Date objects em props de Client
 * Components. Esta função converte ambos para strings ISO seguras.
 */
function serializeDate(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

/**
 * Cria um DTO serializável do formulário para passagem segura ao Client Component.
 * Converte todos os campos de data (incluindo os aninhados em `availability`)
 * para strings ISO, eliminando instâncias de Timestamp/Date que causam o erro
 * React #441 ("Only plain objects can be passed to Client Components").
 */
function serializeFormForClient(form: DynamicForm & { effectiveStatus: FormEffectiveStatus }) {
  return {
    ...form,
    createdAt: serializeDate(form.createdAt) ?? "",
    updatedAt: serializeDate(form.updatedAt) ?? "",
    availability: {
      ...form.availability,
      opensAt: serializeDate(form.availability.opensAt),
      closesAt: serializeDate(form.availability.closesAt),
      activatedAt: serializeDate(form.availability.activatedAt),
    },
  };
}

export default async function AdminFormsPage() {
  console.info("[admin/formularios] iniciando carregamento");

  let forms: Awaited<ReturnType<typeof getAllForms>> = [];
  let counts = { total: 0, active: 0, closed: 0, totalSubmissions: 0 };
  let loadError: string | null = null;

  try {
    console.info("[admin/formularios] iniciando consultas ao Firestore");
    [forms, counts] = await Promise.all([
      getAllForms(),
      getFormAdminCounts(),
    ]);
    console.info("[admin/formularios] consultas concluídas com sucesso, formulários:", forms.length);
  } catch (err) {
    console.error("[admin/formularios] ERRO nas consultas:", {
      name: (err as Error)?.name,
      message: (err as Error)?.message,
      stack: (err as Error)?.stack?.split("\n").slice(0, 5),
    });
    loadError = "Falha ao carregar os formulários. Verifique os Runtime Logs da Vercel para detalhes.";
  }

  // Calcula status efetivo e serializa datas para strings ISO (seguro para Client Components)
  const now = new Date();
  const formsWithStatus = forms.map((form) => {
    const withStatus = {
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
    };
    return serializeFormForClient(withStatus);
  });

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