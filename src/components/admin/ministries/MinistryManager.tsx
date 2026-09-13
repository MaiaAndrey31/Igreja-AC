"use client";

import { useActionState, useEffect, useState } from "react";
import { GripVertical } from "lucide-react";
import { createMinistryAction, updateMinistryAction, deleteMinistryAction } from "@/actions/ministries";
import type { ActionState } from "@/actions/auth";
import { AdminListHeader } from "@/components/admin/AdminListHeader";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Modal } from "@/components/ui/Modal";
import { FieldGroup, Input, Textarea, Select } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { MINISTRY_ICON_OPTIONS, renderMinistryIcon } from "@/components/home/icon-map";

export interface MinistryItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  highlight: boolean;
  order: number;
  published: boolean;
}

const emptyState: ActionState = {};

export function MinistryManager({ items }: { items: MinistryItem[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MinistryItem | null>(null);

  return (
    <div>
      <AdminListHeader
        title="Ministérios"
        description="Frentes exibidas na home e na página /ministerios."
        actionLabel="Novo ministério"
        onAction={() => {
          setEditing(null);
          setModalOpen(true);
        }}
      />

      <div className="mt-8 flex flex-col gap-3">
        {items.map((item) => {
          return (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-xl border border-border-subtle bg-surface px-5 py-4"
            >
              <GripVertical size={16} className="shrink-0 text-foreground-subtle" />
              {renderMinistryIcon(item.icon, { size: 18, className: "shrink-0 text-accent" })}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                <p className="truncate text-xs text-foreground-subtle">{item.description}</p>
              </div>
              {item.highlight && (
                <span className="shrink-0 rounded-full border border-accent/40 px-2.5 py-1 text-[10px] uppercase tracking-wider text-accent">
                  Destaque
                </span>
              )}
              {!item.published && (
                <span className="shrink-0 rounded-full border border-border-soft px-2.5 py-1 text-[10px] uppercase tracking-wider text-foreground-subtle">
                  Rascunho
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditing(item);
                  setModalOpen(true);
                }}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                Editar
              </button>
              <DeleteButton
                confirmMessage={`Excluir o ministério "${item.title}"?`}
                action={() => deleteMinistryAction(item.id)}
              />
            </div>
          );
        })}
        {items.length === 0 && <p className="text-sm text-foreground-subtle">Nenhum ministério cadastrado ainda.</p>}
      </div>

      <MinistryModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
    </div>
  );
}

function MinistryModal({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: MinistryItem | null }) {
  const action = editing ? updateMinistryAction.bind(null, editing.id) : createMinistryAction;
  const [state, formAction] = useActionState(action, emptyState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push(editing ? "Ministério atualizado." : "Ministério criado.");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar ministério" : "Novo ministério"}>
      <form action={formAction} className="flex flex-col gap-4">
        <FieldGroup label="Título" htmlFor="title">
          <Input id="title" name="title" defaultValue={editing?.title} required />
        </FieldGroup>

        <FieldGroup label="Descrição" htmlFor="description">
          <Textarea id="description" name="description" defaultValue={editing?.description} required />
        </FieldGroup>

        <FieldGroup label="Ícone" htmlFor="icon">
          <Select id="icon" name="icon" defaultValue={editing?.icon ?? MINISTRY_ICON_OPTIONS[0].value}>
            {MINISTRY_ICON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FieldGroup>

        <FieldGroup label="Ordem" htmlFor="order" hint="Menor número aparece primeiro.">
          <Input id="order" name="order" type="number" min={0} defaultValue={editing?.order ?? 0} />
        </FieldGroup>

        <Switch label="Destaque especial (ex.: Ministério Infantil)" name="highlight" id="highlight" defaultChecked={editing?.highlight} />
        <Switch label="Publicado no site" name="published" id="published" defaultChecked={editing?.published ?? true} />

        {state.error && <p className="text-sm text-red-400">{state.error}</p>}

        <SubmitButton className="mt-2">{editing ? "Salvar alterações" : "Criar ministério"}</SubmitButton>
      </form>
    </Modal>
  );
}
