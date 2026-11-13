"use client";

import { useActionState, useEffect, useState } from "react";
import { createCellAction, updateCellAction, deleteCellAction } from "@/actions/cells";
import type { ActionState } from "@/actions/auth";
import { AdminListHeader } from "@/components/admin/AdminListHeader";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Modal } from "@/components/ui/Modal";
import { FieldGroup, Input } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";

export interface CellItem {
  id: string;
  name: string;
  leaderName: string;
  neighborhood: string;
  address: string;
  dayTime: string;
  whatsapp: string;
  logoUrl: string | null;
  active: boolean;
  published: boolean;
  addressPublic: boolean;
  locationPublic: boolean;
  city: string | null;
  region: string | null;
  profile: string | null;
  meetingDay: string | null;
  meetingTime: string | null;
  latitude: number | null;
  longitude: number | null;
  order: number;
}

const emptyState: ActionState = {};

export function CellManager({ items }: { items: CellItem[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CellItem | null>(null);
  // Muda a cada abertura — vira `key` do modal, forçando o React a remontá-lo
  // (e reinicializar o `useState` do form) em vez de reidratar via effect.
  const [modalInstance, setModalInstance] = useState(0);

  function openModal(item: CellItem | null) {
    setEditing(item);
    setModalInstance((n) => n + 1);
    setModalOpen(true);
  }

  return (
    <div>
      <AdminListHeader
        title="Células"
        description="Grupos exibidos na página pública de Células."
        actionLabel="Nova célula"
        onAction={() => openModal(null)}
      />

      <div className="mt-8 overflow-x-auto rounded-xl border border-border-subtle">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-foreground-subtle">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Bairro</th>
              <th className="px-4 py-3">Líder</th>
              <th className="px-4 py-3">Dia/Horário</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle bg-surface">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                <td className="px-4 py-3 text-foreground-subtle">{item.neighborhood}</td>
                <td className="px-4 py-3 text-foreground-subtle">{item.leaderName}</td>
                <td className="px-4 py-3 text-foreground-subtle">{item.dayTime}</td>
                <td className="px-4 py-3">
                  <span className={item.active ? "text-emerald-400" : "text-foreground-subtle"}>
                    {item.active ? "Ativa" : "Inativa"}
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
                    <DeleteButton confirmMessage={`Excluir a célula "${item.name}"?`} action={() => deleteCellAction(item.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-foreground-subtle">
                  Nenhuma célula cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CellModal key={modalInstance} open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
    </div>
  );
}

interface CellFormValues {
  name: string;
  leaderName: string;
  neighborhood: string;
  dayTime: string;
  address: string;
  whatsapp: string;
  order: number;
  active: boolean;
  published: boolean;
  addressPublic: boolean;
  locationPublic: boolean;
}

function toCellFormValues(editing: CellItem | null): CellFormValues {
  return {
    name: editing?.name ?? "",
    leaderName: editing?.leaderName ?? "",
    neighborhood: editing?.neighborhood ?? "",
    dayTime: editing?.dayTime ?? "",
    address: editing?.address ?? "",
    whatsapp: editing?.whatsapp ?? "",
    order: editing?.order ?? 0,
    active: editing?.active ?? true,
    published: editing?.published ?? false,
    addressPublic: editing?.addressPublic ?? true,
    locationPublic: editing?.locationPublic ?? false,
  };
}

function CellModal({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: CellItem | null }) {
  const action = editing ? updateCellAction.bind(null, editing.id) : createCellAction;
  const [state, formAction] = useActionState(action, emptyState);
  const { push } = useToast();
  // `CellManager` remonta este componente (via `key`) a cada abertura, então
  // o valor inicial abaixo já nasce correto — não precisa de um effect para
  // "reidratar": remontar com um estado inicial novo é o próprio reset.
  const [values, setValues] = useState<CellFormValues>(() => toCellFormValues(editing));

  useEffect(() => {
    if (state.success) {
      push(editing ? "Célula atualizada." : "Célula criada.");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar célula" : "Nova célula"}>
      <form action={formAction} className="flex flex-col gap-4">
        <FieldGroup label="Nome da célula" htmlFor="name">
          <Input
            id="name"
            name="name"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            required
          />
        </FieldGroup>

        <FieldGroup label="Líder(es)" htmlFor="leaderName">
          <Input
            id="leaderName"
            name="leaderName"
            value={values.leaderName}
            onChange={(e) => setValues((v) => ({ ...v, leaderName: e.target.value }))}
            required
          />
        </FieldGroup>

        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Bairro/região" htmlFor="neighborhood">
            <Input
              id="neighborhood"
              name="neighborhood"
              value={values.neighborhood}
              onChange={(e) => setValues((v) => ({ ...v, neighborhood: e.target.value }))}
              required
            />
          </FieldGroup>
          <FieldGroup label="Dia e horário" htmlFor="dayTime">
            <Input
              id="dayTime"
              name="dayTime"
              placeholder="Quintas, 20h"
              value={values.dayTime}
              onChange={(e) => setValues((v) => ({ ...v, dayTime: e.target.value }))}
              required
            />
          </FieldGroup>
        </div>

        <FieldGroup label="Endereço" htmlFor="address">
          <Input
            id="address"
            name="address"
            value={values.address}
            onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))}
            required
          />
        </FieldGroup>

        <FieldGroup
          label="WhatsApp"
          htmlFor="whatsapp"
          hint="Somente dígitos, com DDI e DDD (ex.: 5547999999999)."
        >
          <Input
            id="whatsapp"
            name="whatsapp"
            value={values.whatsapp}
            onChange={(e) => setValues((v) => ({ ...v, whatsapp: e.target.value }))}
            required
          />
        </FieldGroup>

        <FieldGroup label="Logo da célula" htmlFor="logoFile" hint="JPG, PNG ou WebP, até 8MB. Deixe em branco para manter a logo atual.">
          <Input id="logoFile" name="logoFile" type="file" accept="image/jpeg,image/png,image/webp" />
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
          label="Célula ativa"
          name="active"
          id="active"
          checked={values.active}
          onChange={(e) => setValues((v) => ({ ...v, active: e.target.checked }))}
        />

        <div className="flex flex-col gap-2">
          <Switch
            label="Publicar no site"
            name="published"
            id="published"
            checked={values.published}
            onChange={(e) => setValues((v) => ({ ...v, published: e.target.checked }))}
          />
          <p className="text-[11px] leading-relaxed text-foreground-subtle">
            Ao publicar esta célula, seu endereço completo (rua, número, bairro e cidade) será exibido para os visitantes. Confirme que o líder autorizou a divulgação antes de ativar.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Switch
            label="Divulgar localização exata no mapa"
            name="locationPublic"
            id="locationPublic"
            checked={values.locationPublic}
            onChange={(e) => setValues((v) => ({ ...v, locationPublic: e.target.checked }))}
          />
          <p className="text-[11px] text-foreground-subtle">
            Exibe um marcador com as coordenadas verificadas no mapa interativo. Independente da publicação do endereço textual.
          </p>
        </div>

        {state.error && <p className="text-sm text-red-400">{state.error}</p>}

        <SubmitButton className="mt-2">{editing ? "Salvar alterações" : "Criar célula"}</SubmitButton>
      </form>
    </Modal>
  );
}
