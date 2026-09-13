"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { createLeaderAction, updateLeaderAction, deleteLeaderAction } from "@/actions/leaders";
import type { ActionState } from "@/actions/auth";
import { AdminListHeader } from "@/components/admin/AdminListHeader";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Modal } from "@/components/ui/Modal";
import { FieldGroup, Input, Textarea } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";

export interface LeaderItem {
  id: string;
  name: string;
  role: string;
  quote: string | null;
  photoUrl: string | null;
  active: boolean;
  order: number;
}

const emptyState: ActionState = {};

export function LeaderManager({ items }: { items: LeaderItem[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LeaderItem | null>(null);
  // Muda a cada abertura — vira `key` do modal, forçando o React a remontá-lo
  // (e reinicializar o `useState` do form) em vez de reidratar via effect.
  const [modalInstance, setModalInstance] = useState(0);

  function openModal(item: LeaderItem | null) {
    setEditing(item);
    setModalInstance((n) => n + 1);
    setModalOpen(true);
  }

  return (
    <div>
      <AdminListHeader
        title="Liderança"
        description="Pastores exibidos na home e em /sobre."
        actionLabel="Novo líder"
        onAction={() => openModal(null)}
      />

      <div className="mt-8 overflow-x-auto rounded-xl border border-border-subtle">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-foreground-subtle">
            <tr>
              <th className="px-4 py-3" />
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Função</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle bg-surface">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-surface-2">
                    {item.photoUrl && (
                      <Image src={item.photoUrl} alt="" fill sizes="40px" className="object-cover" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                <td className="px-4 py-3 text-foreground-subtle">{item.role}</td>
                <td className="px-4 py-3">
                  <span className={item.active ? "text-emerald-400" : "text-foreground-subtle"}>
                    {item.active ? "Visível" : "Oculto"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openModal(item)}
                      className="rounded-lg px-3 py-1.5 text-xs text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                    >
                      Editar
                    </button>
                    <DeleteButton
                      confirmMessage={`Excluir "${item.name}" da liderança?`}
                      action={() => deleteLeaderAction(item.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-foreground-subtle">
                  Nenhum líder cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <LeaderModal key={modalInstance} open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
    </div>
  );
}

interface LeaderFormValues {
  name: string;
  role: string;
  quote: string;
  order: number;
  active: boolean;
}

function toLeaderFormValues(editing: LeaderItem | null): LeaderFormValues {
  return {
    name: editing?.name ?? "",
    role: editing?.role ?? "",
    quote: editing?.quote ?? "",
    order: editing?.order ?? 0,
    active: editing?.active ?? true,
  };
}

function LeaderModal({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: LeaderItem | null }) {
  const action = editing ? updateLeaderAction.bind(null, editing.id) : createLeaderAction;
  const [state, formAction] = useActionState(action, emptyState);
  const { push } = useToast();
  // `LeaderManager` remonta este componente (via `key`) a cada abertura,
  // então o valor inicial abaixo já nasce correto.
  const [values, setValues] = useState<LeaderFormValues>(() => toLeaderFormValues(editing));

  useEffect(() => {
    if (state.success) {
      push(editing ? "Líder atualizado." : "Líder adicionado.");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar líder" : "Novo líder"}>
      <form action={formAction} className="flex flex-col gap-4">
        <FieldGroup label="Nome" htmlFor="name">
          <Input
            id="name"
            name="name"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            required
          />
        </FieldGroup>

        <FieldGroup label="Função" htmlFor="role" hint="Ex.: Pastor Sênior, Pastora Alive Kids.">
          <Input
            id="role"
            name="role"
            value={values.role}
            onChange={(e) => setValues((v) => ({ ...v, role: e.target.value }))}
            required
          />
        </FieldGroup>

        <FieldGroup label="Frase (opcional)" htmlFor="quote">
          <Textarea
            id="quote"
            name="quote"
            value={values.quote}
            onChange={(e) => setValues((v) => ({ ...v, quote: e.target.value }))}
          />
        </FieldGroup>

        <FieldGroup
          label="Foto"
          htmlFor="photoFile"
          hint="JPG, PNG ou WebP, até 8MB. Deixe em branco para manter a foto atual."
        >
          <Input id="photoFile" name="photoFile" type="file" accept="image/jpeg,image/png,image/webp" />
        </FieldGroup>

        <FieldGroup label="Ordem" htmlFor="order">
          <Input
            id="order"
            name="order"
            type="number"
            min={0}
            value={values.order}
            onChange={(e) => setValues((v) => ({ ...v, order: Number(e.target.value) }))}
          />
        </FieldGroup>

        <Switch
          label="Visível no site"
          name="active"
          id="active"
          checked={values.active}
          onChange={(e) => setValues((v) => ({ ...v, active: e.target.checked }))}
        />

        {state.error && <p className="text-sm text-red-400">{state.error}</p>}

        <SubmitButton className="mt-2">{editing ? "Salvar alterações" : "Adicionar líder"}</SubmitButton>
      </form>
    </Modal>
  );
}
