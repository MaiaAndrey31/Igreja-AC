"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Copy,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Users,
} from "lucide-react";
import type { DynamicForm, FormEffectiveStatus } from "@/lib/forms/types";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { useToast } from "@/components/ui/Toast";
import {
  duplicateFormAction,
  toggleFormStatusAction,
} from "@/actions/forms";

interface FormListItem extends DynamicForm {
  effectiveStatus: FormEffectiveStatus;
}

const STATUS_LABELS: Record<FormEffectiveStatus, string> = {
  draft: "Rascunho",
  not_yet_open: "Agendado",
  open: "Ativo",
  closed_by_schedule: "Encerrado",
  closed_by_duration: "Expirado",
  closed_manually: "Encerrado",
  full: "Esgotado",
  archived: "Arquivado",
};

const STATUS_STYLES: Record<FormEffectiveStatus, string> = {
  draft: "border-border-soft text-foreground-subtle",
  not_yet_open: "border-accent/30 text-accent",
  open: "border-green-500/30 text-green-400",
  closed_by_schedule: "border-border-soft text-foreground-subtle",
  closed_by_duration: "border-border-soft text-foreground-subtle",
  closed_manually: "border-border-soft text-foreground-subtle",
  full: "border-orange-500/30 text-orange-400",
  archived: "border-border-soft text-foreground-subtle opacity-60",
};

export function FormsListClient({ forms }: { forms: FormListItem[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { push } = useToast();

  const filtered = useMemo(() => {
    return forms.filter((form) => {
      const matchesSearch =
        !search ||
        form.title.toLowerCase().includes(search.toLowerCase()) ||
        form.slug.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && form.effectiveStatus === "open") ||
        (statusFilter === "closed" &&
          ["closed_by_schedule", "closed_by_duration", "closed_manually", "full"].includes(
            form.effectiveStatus
          )) ||
        (statusFilter === "draft" && form.adminStatus === "draft") ||
        (statusFilter === "archived" && form.adminStatus === "archived");

      return matchesSearch && matchesStatus;
    });
  }, [forms, search, statusFilter]);

  async function handleDuplicate(id: string) {
    const result = await duplicateFormAction(id);
    if (result.success) push("Formulário duplicado.");
    else if (result.error) push(result.error);
  }

  async function handleToggleStatus(
    id: string,
    currentStatus: string,
    _slug: string
  ) {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    const result = await toggleFormStatusAction(
      id,
      newStatus as "published" | "draft"
    );
    if (result.success) {
      push(newStatus === "published" ? "Formulário publicado." : "Formulário despublicado.");
    } else if (result.error) {
      push(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle" size={16} />
          <input
            type="text"
            placeholder="Buscar por título ou slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-surface px-10 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="closed">Encerrados</option>
          <option value="draft">Rascunhos</option>
          <option value="archived">Arquivados</option>
        </select>
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-3">
        {filtered.map((form) => (
          <div
            key={form.id}
            className="group flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface px-5 py-4 sm:flex-row sm:items-center"
          >
            {/* Info principal */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/formularios/${form.id}/editar`}
                  className="truncate text-sm font-medium text-foreground hover:text-accent"
                >
                  {form.title}
                </Link>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    STATUS_STYLES[form.effectiveStatus]
                  }`}
                >
                  {STATUS_LABELS[form.effectiveStatus]}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-foreground-subtle">
                <span className="font-data">/{form.slug}</span>
                <span>·</span>
                <span className="capitalize">{form.purpose}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {form.submissionCount}
                  {form.maxSubmissions != null && ` / ${form.maxSubmissions}`}
                </span>
              </div>
            </div>

            {/* Ações */}
            <div className="flex shrink-0 items-center gap-1">
              {form.adminStatus === "published" && (
                <Link
                  href={`/formularios/${form.slug}`}
                  target="_blank"
                  className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                  title="Ver formulário público"
                >
                  <Eye size={16} />
                </Link>
              )}
              <Link
                href={`/admin/formularios/${form.id}/respostas`}
                className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                title="Ver respostas"
              >
                <FileSpreadsheet size={16} />
              </Link>
              <button
                type="button"
                onClick={() => handleDuplicate(form.id)}
                className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                title="Duplicar"
              >
                <Copy size={16} />
              </button>
              <button
                type="button"
                onClick={() =>
                  handleToggleStatus(form.id, form.adminStatus, form.slug)
                }
                className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                title={
                  form.adminStatus === "published" ? "Despublicar" : "Publicar"
                }
              >
                {form.adminStatus === "published" ? (
                  <XCircle size={16} />
                ) : (
                  <CheckCircle2 size={16} />
                )}
              </button>
              <DeleteButton
                confirmMessage={`Excluir o formulário "${form.title}" e todas as suas respostas? Esta ação não pode ser desfeita.`}
                action={() =>
                  import("@/actions/forms").then((m) => m.deleteFormAction(form.id))
                }
              />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-foreground-subtle">
            {forms.length === 0
              ? "Nenhum formulário criado ainda."
              : "Nenhum formulário encontrado com os filtros aplicados."}
          </p>
        )}
      </div>
    </div>
  );
}