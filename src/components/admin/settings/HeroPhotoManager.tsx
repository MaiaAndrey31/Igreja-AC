"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import { addHeroPhotoAction, removeHeroPhotoAction } from "@/actions/settings";
import type { ActionState } from "@/actions/auth";
import { Modal } from "@/components/ui/Modal";
import { FieldGroup, Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";

const emptyState: ActionState = {};

/**
 * Fotos do fundo "Foto" do Hero — uma lista, não um campo único. Cada foto é
 * adicionada/removida na hora (ação própria, grava direto no Firestore),
 * fora do "Salvar configurações" grande — mesmo espírito da Galeria
 * (`/admin/galeria`), só que embutida aqui por ser parte do Hero.
 */
export function HeroPhotoManager({ photoUrls }: { photoUrls: string[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInstance, setModalInstance] = useState(0);
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const { push } = useToast();

  function openAdd() {
    setModalInstance((n) => n + 1);
    setModalOpen(true);
  }

  async function handleRemove(url: string) {
    if (!window.confirm("Remover esta foto do carrossel?")) return;
    setPendingRemoval(url);
    try {
      await removeHeroPhotoAction(url);
      push("Foto removida.");
    } catch {
      push("Não foi possível remover.", "error");
    } finally {
      setPendingRemoval(null);
    }
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">
        Fotos do fundo{photoUrls.length > 1 ? ` — ${photoUrls.length}, alternam automaticamente` : ""}
      </p>

      <div className="mt-2 flex flex-wrap gap-3">
        {photoUrls.map((url) => (
          <div
            key={url}
            className="group relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-surface-2"
          >
            <Image src={url} alt="" fill sizes="128px" className="object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              disabled={pendingRemoval === url}
              aria-label="Remover foto"
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-red-900/80 disabled:opacity-100 group-hover:opacity-100"
            >
              <X size={13} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={openAdd}
          className="flex h-20 w-32 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-soft text-foreground-subtle transition-colors hover:border-accent hover:text-accent"
        >
          <Plus size={16} />
          <span className="text-[11px]">Adicionar foto</span>
        </button>
      </div>

      <p className="mt-2 max-w-md text-xs text-foreground-subtle">
        Uma foto só vira fundo fixo. A partir de duas, elas alternam automaticamente, como um carrossel.
      </p>

      <AddPhotoModal key={modalInstance} open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function AddPhotoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, formAction] = useActionState(addHeroPhotoAction, emptyState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Foto adicionada.");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title="Adicionar foto ao fundo">
      <form action={formAction} className="flex flex-col gap-4">
        <FieldGroup label="Imagem" htmlFor="heroPhotoFile" hint="JPG, PNG ou WebP, até 8MB.">
          <Input
            id="heroPhotoFile"
            name="heroPhotoFile"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
          />
        </FieldGroup>

        {state.error && <p className="text-sm text-red-400">{state.error}</p>}

        <SubmitButton pendingLabel="Enviando..." className="mt-2">
          Adicionar
        </SubmitButton>
      </form>
    </Modal>
  );
}
