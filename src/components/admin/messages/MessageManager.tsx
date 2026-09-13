"use client";

import { useActionState, useEffect, useState } from "react";
import { createMessageAction, updateMessageAction, deleteMessageAction } from "@/actions/messages";
import type { ActionState } from "@/actions/auth";
import { AdminListHeader } from "@/components/admin/AdminListHeader";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Modal } from "@/components/ui/Modal";
import { FieldGroup, Input } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { formatFullDate } from "@/lib/format";

export interface MessageItem {
  id: string;
  title: string;
  speaker: string;
  date: Date;
  youtubeId: string;
  published: boolean;
  order: number;
}

const emptyState: ActionState = {};

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function MessageManager({ items }: { items: MessageItem[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MessageItem | null>(null);
  // Muda a cada abertura — vira `key` do modal, forçando o React a remontá-lo
  // (e reinicializar o `useState` do form) em vez de reidratar via effect.
  const [modalInstance, setModalInstance] = useState(0);

  function openModal(item: MessageItem | null) {
    setEditing(item);
    setModalInstance((n) => n + 1);
    setModalOpen(true);
  }

  return (
    <div>
      <AdminListHeader
        title="Mensagens"
        description="Pregações em destaque na home e em /mensagens."
        actionLabel="Nova mensagem"
        onAction={() => openModal(null)}
      />

      <div className="mt-8 overflow-x-auto rounded-xl border border-border-subtle">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-foreground-subtle">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Pregador</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle bg-surface">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium text-foreground">{item.title}</td>
                <td className="px-4 py-3 text-foreground-subtle">{item.speaker}</td>
                <td className="px-4 py-3 text-foreground-subtle">{formatFullDate(item.date)}</td>
                <td className="px-4 py-3">
                  <span className={item.published ? "text-emerald-400" : "text-foreground-subtle"}>
                    {item.published ? "Publicada" : "Rascunho"}
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
                      confirmMessage={`Excluir a mensagem "${item.title}"?`}
                      action={() => deleteMessageAction(item.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-foreground-subtle">
                  Nenhuma mensagem cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <MessageModal key={modalInstance} open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
    </div>
  );
}

interface MessageFormValues {
  title: string;
  speaker: string;
  date: string;
  youtubeId: string;
  order: number;
  published: boolean;
}

function toMessageFormValues(editing: MessageItem | null): MessageFormValues {
  return {
    title: editing?.title ?? "",
    speaker: editing?.speaker ?? "",
    date: editing ? toDateInputValue(editing.date) : "",
    youtubeId: editing?.youtubeId ?? "",
    order: editing?.order ?? 0,
    published: editing?.published ?? true,
  };
}

function MessageModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: MessageItem | null;
}) {
  const action = editing ? updateMessageAction.bind(null, editing.id) : createMessageAction;
  const [state, formAction] = useActionState(action, emptyState);
  const { push } = useToast();
  // `MessageManager` remonta este componente (via `key`) a cada abertura,
  // então o valor inicial abaixo já nasce correto.
  const [values, setValues] = useState<MessageFormValues>(() => toMessageFormValues(editing));

  useEffect(() => {
    if (state.success) {
      push(editing ? "Mensagem atualizada." : "Mensagem criada.");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar mensagem" : "Nova mensagem"}>
      <form action={formAction} className="flex flex-col gap-4">
        <FieldGroup label="Título" htmlFor="title">
          <Input
            id="title"
            name="title"
            value={values.title}
            onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
            required
          />
        </FieldGroup>

        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Pregador" htmlFor="speaker">
            <Input
              id="speaker"
              name="speaker"
              value={values.speaker}
              onChange={(e) => setValues((v) => ({ ...v, speaker: e.target.value }))}
              required
            />
          </FieldGroup>
          <FieldGroup label="Data" htmlFor="date">
            <Input
              id="date"
              name="date"
              type="date"
              value={values.date}
              onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
              required
            />
          </FieldGroup>
        </div>

        <FieldGroup
          label="ID do vídeo no YouTube"
          htmlFor="youtubeId"
          hint="O que vem depois de ?v= na URL do YouTube."
        >
          <Input
            id="youtubeId"
            name="youtubeId"
            value={values.youtubeId}
            onChange={(e) => setValues((v) => ({ ...v, youtubeId: e.target.value }))}
            required
          />
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
          label="Publicada"
          name="published"
          id="published"
          checked={values.published}
          onChange={(e) => setValues((v) => ({ ...v, published: e.target.checked }))}
        />

        {state.error && <p className="text-sm text-red-400">{state.error}</p>}

        <SubmitButton className="mt-2">{editing ? "Salvar alterações" : "Criar mensagem"}</SubmitButton>
      </form>
    </Modal>
  );
}
