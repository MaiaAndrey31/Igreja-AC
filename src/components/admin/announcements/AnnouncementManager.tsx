"use client";

import { useActionState, useEffect, useState } from "react";
import { createAnnouncementAction, updateAnnouncementAction, deleteAnnouncementAction } from "@/actions/announcements";
import type { ActionState } from "@/actions/auth";
import { AdminListHeader } from "@/components/admin/AdminListHeader";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Modal } from "@/components/ui/Modal";
import { FieldGroup, Input, Textarea, Select } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { formatEventDate } from "@/lib/format";

export interface AnnouncementItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  instagramUrl: string | null;
  category: string;
  startDate: Date;
  endDate: Date | null;
  published: boolean;
}

const emptyState: ActionState = {};

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function AnnouncementManager({ items }: { items: AnnouncementItem[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AnnouncementItem | null>(null);

  return (
    <div>
      <AdminListHeader
        title="Avisos"
        description="Cultos especiais, conferências e comunicados."
        actionLabel="Novo aviso"
        onAction={() => {
          setEditing(null);
          setModalOpen(true);
        }}
      />

      <div className="mt-8 flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 rounded-xl border border-border-subtle bg-surface px-5 py-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-accent">
                <span>{item.category}</span>
                <span className="text-foreground-subtle">· {formatEventDate(item.startDate)}</span>
              </div>
              <p className="mt-1 truncate text-sm font-medium text-foreground">{item.title}</p>
            </div>
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
            <DeleteButton confirmMessage={`Excluir o aviso "${item.title}"?`} action={() => deleteAnnouncementAction(item.id)} />
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-foreground-subtle">Nenhum aviso cadastrado ainda.</p>}
      </div>

      <AnnouncementModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
    </div>
  );
}

interface AnnouncementFormValues {
  title: string;
  description: string;
  instagramUrl: string;
  category: string;
  startDate: string;
  endDate: string;
  published: boolean;
}

function toFormValues(editing: AnnouncementItem | null): AnnouncementFormValues {
  return {
    title: editing?.title ?? "",
    description: editing?.description ?? "",
    instagramUrl: editing?.instagramUrl ?? "",
    category: editing?.category ?? "Aviso",
    startDate: editing ? toDateInputValue(editing.startDate) : "",
    endDate: editing?.endDate ? toDateInputValue(editing.endDate) : "",
    published: editing?.published ?? true,
  };
}

function AnnouncementModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: AnnouncementItem | null;
}) {
  const action = editing ? updateAnnouncementAction.bind(null, editing.id) : createAnnouncementAction;
  const [state, formAction] = useActionState(action, emptyState);
  const { push } = useToast();
  const [values, setValues] = useState<AnnouncementFormValues>(() => toFormValues(editing));

  // Reidrata os campos sempre que o modal abre — evita mostrar valores de uma
  // edição anterior (o Modal fica montado, só é escondido) e evita que o reset
  // automático do <form action> após um submit com erro apague o que o usuário digitou.
  useEffect(() => {
    if (open) setValues(toFormValues(editing));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  useEffect(() => {
    if (state.success) {
      push(editing ? "Aviso atualizado." : "Aviso criado.");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar aviso" : "Novo aviso"}>
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

        <FieldGroup label="Descrição" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
            required
          />
        </FieldGroup>

        <FieldGroup label="Categoria" htmlFor="category">
          <Select
            id="category"
            name="category"
            value={values.category}
            onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
          >
            <option value="Aviso">Aviso</option>
            <option value="Culto especial">Culto especial</option>
            <option value="Conferência">Conferência</option>
          </Select>
        </FieldGroup>

        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Data de início" htmlFor="startDate">
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={values.startDate}
              onChange={(e) => setValues((v) => ({ ...v, startDate: e.target.value }))}
              required
            />
          </FieldGroup>
          <FieldGroup label="Data final (opcional)" htmlFor="endDate">
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={values.endDate}
              onChange={(e) => setValues((v) => ({ ...v, endDate: e.target.value }))}
            />
          </FieldGroup>
        </div>

        <FieldGroup label="Imagem (opcional)" htmlFor="imageFile" hint="JPG, PNG ou WebP, até 8MB.">
          <Input id="imageFile" name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" />
        </FieldGroup>

        <FieldGroup
          label="Link do vídeo no Instagram (opcional)"
          htmlFor="instagramUrl"
          hint="Cole o link do post/reel. Um ícone do Instagram aparece no aviso, levando direto pro vídeo."
        >
          <Input
            id="instagramUrl"
            name="instagramUrl"
            type="url"
            placeholder="https://www.instagram.com/reel/..."
            value={values.instagramUrl}
            onChange={(e) => setValues((v) => ({ ...v, instagramUrl: e.target.value }))}
          />
        </FieldGroup>

        <Switch
          label="Publicado no site"
          name="published"
          id="published"
          checked={values.published}
          onChange={(e) => setValues((v) => ({ ...v, published: e.target.checked }))}
        />

        {state.error && <p className="text-sm text-red-400">{state.error}</p>}

        <SubmitButton className="mt-2">{editing ? "Salvar alterações" : "Criar aviso"}</SubmitButton>
      </form>
    </Modal>
  );
}
