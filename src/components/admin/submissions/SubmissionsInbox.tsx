"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateSubmissionStatusAction, deleteSubmissionAction } from "@/actions/formSubmissions";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { FormSubmissionStatus, FormSubmissionType } from "@/lib/firebase/collections";

export interface SubmissionItem {
  id: string;
  type: FormSubmissionType;
  name: string;
  contact: string;
  message: string | null;
  status: FormSubmissionStatus;
  createdAt: Date;
}

const TYPE_LABELS: Record<FormSubmissionType, string> = {
  celula: "Célula",
  decisao: "Decisão por Jesus",
  testemunho: "Testemunho",
  oracao: "Pedido de oração",
};

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type Filter = "todos" | FormSubmissionStatus;

export function SubmissionsInbox({ items }: { items: SubmissionItem[] }) {
  const [filter, setFilter] = useState<Filter>("novo");

  const filtered = useMemo(
    () => (filter === "todos" ? items : items.filter((item) => item.status === filter)),
    [items, filter]
  );

  const unreadCount = items.filter((item) => item.status === "novo").length;

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl tracking-wide text-foreground">Contatos</h1>
        <p className="mt-2 text-sm text-foreground-subtle">
          Envios dos formulários públicos (célula, decisão, testemunho, oração).
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["novo", `Novos${unreadCount > 0 ? ` (${unreadCount})` : ""}`],
            ["atendido", "Atendidos"],
            ["todos", "Todos"],
          ] as [Filter, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors",
              filter === value
                ? "border-accent text-accent"
                : "border-border-soft text-foreground-subtle hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {filtered.length === 0 && (
          <p className="rounded-xl border border-border-subtle bg-surface px-4 py-6 text-center text-sm text-foreground-subtle">
            Nenhum envio por aqui.
          </p>
        )}

        {filtered.map((item) => (
          <SubmissionCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function SubmissionCard({ item }: { item: SubmissionItem }) {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();

  function toggleStatus() {
    const next: FormSubmissionStatus = item.status === "novo" ? "atendido" : "novo";
    startTransition(async () => {
      try {
        await updateSubmissionStatusAction(item.id, next);
        push(next === "atendido" ? "Marcado como atendido." : "Reaberto.");
      } catch {
        push("Não foi possível atualizar.", "error");
      }
    });
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="font-data text-[11px] uppercase tracking-[0.16em] text-accent">
            {TYPE_LABELS[item.type]}
          </span>
          <p className="font-display mt-1 text-xl uppercase text-foreground">{item.name}</p>
          <p className="font-data mt-1 text-sm text-foreground-muted">{item.contact}</p>
        </div>
        <div className="text-right">
          <span
            className={cn(
              "inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.14em]",
              item.status === "novo" ? "bg-accent/15 text-accent" : "bg-surface-2 text-foreground-subtle"
            )}
          >
            {item.status === "novo" ? "Novo" : "Atendido"}
          </span>
          <p className="font-data mt-2 text-xs text-foreground-subtle">{dateTimeFormatter.format(item.createdAt)}</p>
        </div>
      </div>

      {item.message && (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground-muted">{item.message}</p>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-border-subtle pt-4">
        <button
          type="button"
          onClick={toggleStatus}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-50"
        >
          {pending && <Loader2 size={14} className="animate-spin" />}
          {item.status === "novo" ? "Marcar como atendido" : "Reabrir"}
        </button>
        <DeleteButton
          confirmMessage={`Excluir o contato de "${item.name}"?`}
          action={() => deleteSubmissionAction(item.id)}
        />
      </div>
    </div>
  );
}
