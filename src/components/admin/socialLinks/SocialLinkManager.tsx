"use client";

import { useActionState, useEffect, useState } from "react";
import { createSocialLinkAction, updateSocialLinkAction, deleteSocialLinkAction } from "@/actions/socialLinks";
import type { ActionState } from "@/actions/auth";
import type { SocialPlatform } from "@/lib/firebase/collections";
import { AdminListHeader } from "@/components/admin/AdminListHeader";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Modal } from "@/components/ui/Modal";
import { FieldGroup, Input, Select } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";

export interface SocialLinkItem {
  id: string;
  platform: SocialPlatform;
  label: string;
  handle: string;
  href: string;
  external: boolean;
  order: number;
}

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  email: "E-mail",
  youtube: "YouTube",
  other: "Outro",
};

const emptyState: ActionState = {};

export function SocialLinkManager({ items }: { items: SocialLinkItem[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SocialLinkItem | null>(null);
  // Muda a cada abertura — vira `key` do modal, forçando o React a remontá-lo
  // (e reinicializar o `useState` do form) em vez de reidratar via effect.
  const [modalInstance, setModalInstance] = useState(0);

  function openModal(item: SocialLinkItem | null) {
    setEditing(item);
    setModalInstance((n) => n + 1);
    setModalOpen(true);
  }

  return (
    <div>
      <AdminListHeader
        title="Redes sociais"
        description="Canais exibidos no rodapé e usados pelo site (Instagram, WhatsApp etc.)."
        actionLabel="Novo canal"
        onAction={() => openModal(null)}
      />

      <div className="mt-8 overflow-x-auto rounded-xl border border-border-subtle">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-foreground-subtle">
            <tr>
              <th className="px-4 py-3">Canal</th>
              <th className="px-4 py-3">Rótulo</th>
              <th className="px-4 py-3">Identificador</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle bg-surface">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium text-foreground">{PLATFORM_LABELS[item.platform]}</td>
                <td className="px-4 py-3 text-foreground-subtle">{item.label}</td>
                <td className="px-4 py-3 text-foreground-subtle">{item.handle}</td>
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
                      confirmMessage={`Excluir o canal "${item.label}"?`}
                      action={() => deleteSocialLinkAction(item.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-foreground-subtle">
                  Nenhum canal cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SocialLinkModal key={modalInstance} open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
    </div>
  );
}

interface SocialLinkFormValues {
  platform: SocialPlatform;
  label: string;
  handle: string;
  href: string;
  order: number;
  external: boolean;
}

function toFormValues(editing: SocialLinkItem | null): SocialLinkFormValues {
  return {
    platform: editing?.platform ?? "instagram",
    label: editing?.label ?? "",
    handle: editing?.handle ?? "",
    href: editing?.href ?? "",
    order: editing?.order ?? 0,
    external: editing?.external ?? true,
  };
}

function SocialLinkModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: SocialLinkItem | null;
}) {
  const action = editing ? updateSocialLinkAction.bind(null, editing.id) : createSocialLinkAction;
  const [state, formAction] = useActionState(action, emptyState);
  const { push } = useToast();
  // `SocialLinkManager` remonta este componente (via `key`) a cada abertura,
  // então o valor inicial abaixo já nasce correto.
  const [values, setValues] = useState<SocialLinkFormValues>(() => toFormValues(editing));

  useEffect(() => {
    if (state.success) {
      push(editing ? "Canal atualizado." : "Canal adicionado.");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar canal" : "Novo canal"}>
      <form action={formAction} className="flex flex-col gap-4">
        <FieldGroup label="Plataforma" htmlFor="platform">
          <Select
            id="platform"
            name="platform"
            value={values.platform}
            onChange={(e) => setValues((v) => ({ ...v, platform: e.target.value as SocialPlatform }))}
          >
            {(Object.entries(PLATFORM_LABELS) as [SocialPlatform, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FieldGroup>

        <FieldGroup label="Rótulo" htmlFor="label" hint="Como aparece no rodapé, ex.: Instagram.">
          <Input
            id="label"
            name="label"
            value={values.label}
            onChange={(e) => setValues((v) => ({ ...v, label: e.target.value }))}
            required
          />
        </FieldGroup>

        <FieldGroup label="Identificador público" htmlFor="handle" hint="Ex.: @iacadamantina, ou o e-mail/telefone exibido.">
          <Input
            id="handle"
            name="handle"
            value={values.handle}
            onChange={(e) => setValues((v) => ({ ...v, handle: e.target.value }))}
            required
          />
        </FieldGroup>

        <FieldGroup label="Link" htmlFor="href" hint="URL completa (https://...), ou mailto:/tel: quando aplicável.">
          <Input
            id="href"
            name="href"
            value={values.href}
            onChange={(e) => setValues((v) => ({ ...v, href: e.target.value }))}
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
          label="Abre em nova aba"
          name="external"
          id="external"
          checked={values.external}
          onChange={(e) => setValues((v) => ({ ...v, external: e.target.checked }))}
        />

        {state.error && <p className="text-sm text-red-400">{state.error}</p>}

        <SubmitButton className="mt-2">{editing ? "Salvar alterações" : "Adicionar canal"}</SubmitButton>
      </form>
    </Modal>
  );
}
