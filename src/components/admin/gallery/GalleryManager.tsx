"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { uploadGalleryImageAction, updateGalleryImageAction, deleteGalleryImageAction } from "@/actions/gallery";
import type { ActionState } from "@/actions/auth";
import { AdminListHeader } from "@/components/admin/AdminListHeader";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Modal } from "@/components/ui/Modal";
import { FieldGroup, Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";

export interface GalleryItem {
  id: string;
  url: string;
  alt: string;
  eventName: string | null;
  order: number;
}

const emptyState: ActionState = {};

export function GalleryManager({ items }: { items: GalleryItem[] }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);

  return (
    <div>
      <AdminListHeader
        title="Galeria"
        description="Fotos exibidas na galeria pública do site."
        actionLabel="Enviar foto"
        onAction={() => setUploadOpen(true)}
      />

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
            <div className="relative aspect-square">
              {item.url ? (
                <Image src={item.url} alt={item.alt} fill sizes="240px" className="object-cover" />
              ) : (
                <MediaPlaceholder label="Sem imagem enviada" />
              )}
            </div>
            <div className="p-3">
              <p className="truncate text-xs text-foreground-muted">{item.eventName || item.alt}</p>
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  className="rounded-lg px-2 py-1 text-xs text-foreground-subtle transition-colors hover:bg-surface-2 hover:text-foreground"
                >
                  Editar
                </button>
                <DeleteButton confirmMessage="Excluir esta foto da galeria?" action={() => deleteGalleryImageAction(item.id)} />
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="col-span-full text-sm text-foreground-subtle">Nenhuma foto enviada ainda.</p>}
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      {editing && <EditModal item={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, formAction] = useActionState(uploadGalleryImageAction, emptyState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Foto enviada.");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title="Enviar foto">
      <form action={formAction} className="flex flex-col gap-4">
        <FieldGroup label="Arquivo" htmlFor="file" hint="JPG, PNG ou WebP, mínimo 200x200px, até 8MB.">
          <Input id="file" name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
        </FieldGroup>
        <FieldGroup label="Texto alternativo" htmlFor="alt" hint="Descreva a imagem para acessibilidade.">
          <Input id="alt" name="alt" required />
        </FieldGroup>
        <FieldGroup label="Evento (opcional)" htmlFor="eventName">
          <Input id="eventName" name="eventName" placeholder="Ex.: Conferência 2026" />
        </FieldGroup>

        {state.error && <p className="text-sm text-red-400">{state.error}</p>}

        <SubmitButton pendingLabel="Enviando..." className="mt-2">
          Enviar foto
        </SubmitButton>
      </form>
    </Modal>
  );
}

function EditModal({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  const action = updateGalleryImageAction.bind(null, item.id);
  const [state, formAction] = useActionState(action, emptyState);
  const { push } = useToast();
  const [alt, setAlt] = useState(item.alt);
  const [eventName, setEventName] = useState(item.eventName ?? "");
  const [order, setOrder] = useState(item.order);

  useEffect(() => {
    if (state.success) {
      push("Foto atualizada.");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Editar foto">
      <form action={formAction} className="flex flex-col gap-4">
        <FieldGroup label="Texto alternativo" htmlFor="alt">
          <Input id="alt" name="alt" value={alt} onChange={(e) => setAlt(e.target.value)} required />
        </FieldGroup>
        <FieldGroup label="Evento (opcional)" htmlFor="eventName">
          <Input id="eventName" name="eventName" value={eventName} onChange={(e) => setEventName(e.target.value)} />
        </FieldGroup>
        <FieldGroup label="Ordem" htmlFor="order" hint="Menor número aparece primeiro.">
          <Input
            id="order"
            name="order"
            type="number"
            min={0}
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
          />
        </FieldGroup>

        {state.error && <p className="text-sm text-red-400">{state.error}</p>}

        <SubmitButton className="mt-2">Salvar alterações</SubmitButton>
      </form>
    </Modal>
  );
}
