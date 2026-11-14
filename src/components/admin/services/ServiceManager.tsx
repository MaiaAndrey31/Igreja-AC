"use client";

import { useActionState, useEffect, useState } from "react";
import { createServiceAction, updateServiceAction, deleteServiceAction } from "@/actions/services";
import type { ActionState } from "@/actions/auth";
import type { Weekday } from "@/lib/services";
import { WEEKDAY_LABELS } from "@/lib/services";
import type { ScheduleType } from "@/lib/firebase/collections";
import { AdminListHeader } from "@/components/admin/AdminListHeader";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Modal } from "@/components/ui/Modal";
import { FieldGroup, Input, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";

export interface ServiceItem {
  id: string;
  type: ScheduleType;
  weekday?: Weekday;
  date?: string;
  time: string;
  label: string | null;
  order: number;
}

/** Formata data YYYY-MM-DD para exibição em pt-BR. */
function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const emptyState: ActionState = {};

export function ServiceManager({ items }: { items: ServiceItem[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  // Muda a cada abertura — vira `key` do modal, forçando o React a remontá-lo
  // (e reinicializar o `useState` do form) em vez de reidratar via effect.
  const [modalInstance, setModalInstance] = useState(0);

  function openModal(item: ServiceItem | null) {
    setEditing(item);
    setModalInstance((n) => n + 1);
    setModalOpen(true);
  }

  return (
    <div>
      <AdminListHeader
        title="Horários de celebração"
        description="Grade semanal exibida na home e em /sobre."
        actionLabel="Novo horário"
        onAction={() => openModal(null)}
      />

      <div className="mt-8 overflow-x-auto rounded-xl border border-border-subtle">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-foreground-subtle">
            <tr>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Dia / Data</th>
              <th className="px-4 py-3">Horário</th>
              <th className="px-4 py-3">Rótulo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle bg-surface">
            {items.map((item) => {
              const isWeekly = item.type === "weekly";
              const dayLabel = isWeekly
                ? WEEKDAY_LABELS[item.weekday!]
                : item.date
                  ? formatDateBR(item.date)
                  : "—";
              const typeLabel = isWeekly ? "Semanal" : "Acontecimento único";
              const confirmMsg = isWeekly
                ? `Excluir o horário de ${dayLabel} às ${item.time}?`
                : `Excluir o horário de ${dayLabel} às ${item.time}?`;

              return (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        isWeekly
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {typeLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{dayLabel}</td>
                  <td className="font-data px-4 py-3 text-foreground-subtle">{item.time}</td>
                  <td className="px-4 py-3 text-foreground-subtle">{item.label ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openModal(item)}
                        className="rounded-lg px-3 py-1.5 text-xs text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                      >
                        Editar
                      </button>
                      <DeleteButton confirmMessage={confirmMsg} action={() => deleteServiceAction(item.id)} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-foreground-subtle">
                  Nenhum horário cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ServiceModal key={modalInstance} open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
    </div>
  );
}

interface ServiceFormValues {
  type: ScheduleType;
  weekday: Weekday;
  date: string;
  time: string;
  label: string;
  order: number;
}

function toFormValues(editing: ServiceItem | null): ServiceFormValues {
  return {
    type: editing?.type ?? "weekly",
    weekday: editing?.weekday ?? 0,
    date: editing?.date ?? "",
    time: editing?.time ?? "",
    label: editing?.label ?? "",
    order: editing?.order ?? 0,
  };
}

function ServiceModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: ServiceItem | null;
}) {
  const action = editing ? updateServiceAction.bind(null, editing.id) : createServiceAction;
  const [state, formAction] = useActionState(action, emptyState);
  const { push } = useToast();
  // `ServiceManager` remonta este componente (via `key`) a cada abertura,
  // então o valor inicial abaixo já nasce correto.
  const [values, setValues] = useState<ServiceFormValues>(() => toFormValues(editing));

  useEffect(() => {
    if (state.success) {
      push(editing ? "Horário atualizado." : "Horário criado.");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  const isWeekly = values.type === "weekly";

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar horário" : "Novo horário"}>
      <form action={formAction} className="flex flex-col gap-4">
        <FieldGroup label="Tipo de programação" htmlFor="type">
          <Select
            id="type"
            name="type"
            value={values.type}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                type: e.target.value as ScheduleType,
              }))
            }
          >
            <option value="weekly">Semanal</option>
            <option value="one_time">Acontecimento único</option>
          </Select>
        </FieldGroup>

        {isWeekly ? (
          <FieldGroup label="Dia da semana" htmlFor="weekday">
            <Select
              id="weekday"
              name="weekday"
              value={values.weekday}
              onChange={(e) => setValues((v) => ({ ...v, weekday: Number(e.target.value) as Weekday }))}
            >
              {(Object.entries(WEEKDAY_LABELS) as [string, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FieldGroup>
        ) : (
          <FieldGroup label="Data do acontecimento" htmlFor="date" hint="Formato DD/MM/AAAA.">
            <Input
              id="date"
              name="date"
              type="date"
              value={values.date}
              onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
              required
            />
          </FieldGroup>
        )}

        <FieldGroup label="Horário" htmlFor="time" hint="Formato 24h, ex.: 20:00.">
          <Input
            id="time"
            name="time"
            type="time"
            value={values.time}
            onChange={(e) => setValues((v) => ({ ...v, time: e.target.value }))}
            required
          />
        </FieldGroup>

        <FieldGroup label="Rótulo (opcional)" htmlFor="label" hint="Ex.: Juventude Alive.">
          <Input
            id="label"
            name="label"
            value={values.label}
            onChange={(e) => setValues((v) => ({ ...v, label: e.target.value }))}
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

        {state.error && <p className="text-sm text-red-400">{state.error}</p>}

        <SubmitButton className="mt-2">{editing ? "Salvar alterações" : "Criar horário"}</SubmitButton>
      </form>
    </Modal>
  );
}
