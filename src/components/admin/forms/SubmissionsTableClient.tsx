"use client";

import { useState, useMemo } from "react";
import { Search, Download, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import type { DynamicFormField, DynamicFormSubmission } from "@/lib/forms/types";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { useToast } from "@/components/ui/Toast";
import {
  deleteDynamicSubmissionAction,
  cancelDynamicSubmissionAction,
  exportSubmissionsCsvAction,
} from "@/actions/dynamicSubmissions";

const PAGE_SIZE = 25;

interface SubmissionsTableProps {
  formId: string;
  fields: DynamicFormField[];
  submissions: DynamicFormSubmission[];
  maxSubmissions: number | null;
}

export function SubmissionsTableClient({
  formId,
  fields,
  submissions,
  maxSubmissions,
}: SubmissionsTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);
  const { push } = useToast();

  // Filtra por texto em qualquer resposta
  const filtered = useMemo(() => {
    if (!search) return submissions;
    const lower = search.toLowerCase();
    return submissions.filter((sub) => {
      // Busca no status
      if (sub.status.toLowerCase().includes(lower)) return true;
      // Busca nos valores das respostas
      for (const value of Object.values(sub.answers)) {
        if (value == null) continue;
        const str = Array.isArray(value) ? value.join(" ") : String(value);
        if (str.toLowerCase().includes(lower)) return true;
      }
      return false;
    });
  }, [submissions, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  async function handleExport() {
    setExporting(true);
    try {
      const result = await exportSubmissionsCsvAction(formId);
      if ("error" in result) {
        push(result.error);
        return;
      }
      // Download via blob
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      push("Exportação concluída.");
    } catch {
      push("Falha ao exportar.");
    } finally {
      setExporting(false);
    }
  }

  async function handleCancel(submissionId: string) {
    const result = await cancelDynamicSubmissionAction(formId, submissionId);
    if (result.success) push("Inscrição cancelada e vaga liberada.");
    else if (result.error) push(result.error);
  }

  function formatAnswer(field: DynamicFormField, value: unknown): string {
    if (value == null) return "—";
    if (Array.isArray(value)) return value.join(", ");
    if (field.type === "boolean" || field.type === "consent") {
      return value ? "Sim" : "Não";
    }
    if (field.type === "file") {
      const url = String(value);
      return url ? `[arquivo](${url})` : "—";
    }
    return String(value);
  }

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de ações */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle" size={16} />
          <input
            type="text"
            placeholder="Buscar nas respostas..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full rounded-lg border border-border-subtle bg-surface px-10 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || submissions.length === 0}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-border-soft px-4 py-2.5 text-sm text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-50"
        >
          <Download size={16} />
          {exporting ? "Exportando..." : "Exportar CSV"}
        </button>
      </div>

      {/* Info */}
      <div className="flex items-center gap-4 text-xs text-foreground-subtle">
        <span>{filtered.length} resposta(s)</span>
        {maxSubmissions != null && (
          <span>
            Vagas: {maxSubmissions - submissions.filter((s) => s.status === "confirmed").length} / {maxSubmissions}
          </span>
        )}
      </div>

      {/* Tabela responsiva */}
      <div className="overflow-x-auto rounded-xl border border-border-subtle">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-subtle bg-surface">
            <tr>
              <th className="px-4 py-3 font-medium text-foreground-subtle">Status</th>
              <th className="px-4 py-3 font-medium text-foreground-subtle">Data</th>
              {fields.map((field) => (
                <th key={field.id} className="max-w-[200px] truncate px-4 py-3 font-medium text-foreground-subtle">
                  {field.label}
                </th>
              ))}
              <th className="px-4 py-3 font-medium text-foreground-subtle">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {paged.map((sub) => (
              <tr key={sub.id} className={sub.status === "cancelled" ? "opacity-50" : ""}>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                      sub.status === "confirmed"
                        ? "bg-green-500/15 text-green-400"
                        : "bg-red-500/15 text-red-400"
                    }`}
                  >
                    {sub.status === "confirmed" ? "Confirmada" : "Cancelada"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-data text-foreground-muted">
                  {formatDate(sub.createdAt)}
                </td>
                {fields.map((field) => (
                  <td key={field.id} className="max-w-[200px] truncate px-4 py-3 text-foreground-muted">
                    {formatAnswer(field, sub.answers[field.id])}
                  </td>
                ))}
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-1">
                    {sub.status === "confirmed" && (
                      <button
                        type="button"
                        onClick={() => handleCancel(sub.id)}
                        className="rounded-lg p-1.5 text-foreground-muted transition-colors hover:bg-surface-2 hover:text-orange-400"
                        title="Cancelar inscrição (libera vaga)"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                    <DeleteButton
                      confirmMessage="Excluir esta resposta permanentemente?"
                      action={() => deleteDynamicSubmissionAction(formId, sub.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td
                  colSpan={3 + fields.length}
                  className="py-8 text-center text-sm text-foreground-subtle"
                >
                  {submissions.length === 0
                    ? "Nenhuma resposta recebida ainda."
                    : "Nenhuma resposta encontrada com o filtro aplicado."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-foreground-subtle">
          <span>
            Página {page + 1} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}