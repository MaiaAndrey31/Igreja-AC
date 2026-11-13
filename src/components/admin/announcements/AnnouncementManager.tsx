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
  // Campos de pop-up
  showAsPopup: boolean;
  popupButtonText: string | null;
  popupButtonUrl: string | null;
  popupPriority: number;
  popupFrequency: "session" | "lifetime" | "visit";
}

const emptyState: ActionState = {};

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function AnnouncementManager({ items }: { items: AnnouncementItem[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AnnouncementItem | null>(null);
  // Muda a cada abertura — vira `key` do modal, forçando o React a remontá-lo
  // (e reinicializar o `useState` do form) em vez de reidratar via effect.
  const [modalInstance, setModalInstance] = useState(0);

  function openModal(item: AnnouncementItem | null) {
    setEditing(item);
    setModalInstance((n) => n + 1);
    setModalOpen(true);
  }

  return (
    <div>
      <AdminListHeader
        title="Avisos"
        description="Cultos especiais, conferências e comunicados."
        actionLabel="Novo aviso"
        onAction={() => openModal(null)}
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
              onClick={() => openModal(item)}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              Editar
            </button>
            <DeleteButton confirmMessage={`Excluir o aviso "${item.title}"?`} action={() => deleteAnnouncementAction(item.id)} />
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-foreground-subtle">Nenhum aviso cadastrado ainda.</p>}
      </div>

      <AnnouncementModal key={modalInstance} open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
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
  // Novos campos do módulo de eventos
  visualId: string;
  groupUrl: string;
  confirmationMessage: string;
  // Campos de pop-up
  showAsPopup: boolean;
  popupButtonText: string;
  popupButtonUrl: string;
  popupPriority: string;
  popupFrequency: "session" | "lifetime" | "visit";
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
    visualId: (editing as AnnouncementItem & { visualId?: string })?.visualId ?? "",
    groupUrl: (editing as AnnouncementItem & { groupUrl?: string })?.groupUrl ?? "",
    confirmationMessage: (editing as AnnouncementItem & { confirmationMessage?: string })?.confirmationMessage ?? "",
    showAsPopup: editing?.showAsPopup ?? false,
    popupButtonText: editing?.popupButtonText ?? "",
    popupButtonUrl: editing?.popupButtonUrl ?? "",
    popupPriority: String(editing?.popupPriority ?? 0),
    popupFrequency: editing?.popupFrequency ?? "session",
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
  // `AnnouncementManager` remonta este componente (via `key`) a cada
  // abertura, então o valor inicial abaixo já nasce correto — não precisa de
  // um effect para "reidratar": remontar com um estado inicial novo é o
  // próprio reset.
  const [values, setValues] = useState<AnnouncementFormValues>(() => toFormValues(editing));

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

        {/* Seção: Identidade Visual do Evento */}
        <div className="flex flex-col gap-4 rounded-lg border border-border-subtle p-4">
          <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-foreground-subtle">
            Identidade Visual do Evento
          </h3>

          <FieldGroup label="Arte de divulgação (opcional)" htmlFor="imageFile" hint="JPG, PNG ou WebP, até 8MB. A imagem aparece na página pública e nos cartões do evento.">
            <Input id="imageFile" name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" />
          </FieldGroup>

          <FieldGroup
            label="ID Visual do Evento (opcional)"
            htmlFor="visualId"
            hint="Identificação visual personalizada da organização. Não é a chave primária do sistema."
          >
            <Input
              id="visualId"
              name="visualId"
              value={values.visualId}
              onChange={(e) => setValues((v) => ({ ...v, visualId: e.target.value }))}
              placeholder="Ex.: EVT-2026-RET-JOVENS"
              maxLength={60}
            />
          </FieldGroup>
        </div>

        {/* Seção: Integrações e Links */}
        <div className="flex flex-col gap-4 rounded-lg border border-border-subtle p-4">
          <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-foreground-subtle">
            Integrações e Links
          </h3>

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

          <FieldGroup
            label="Link do Grupo do Evento (opcional)"
            htmlFor="groupUrl"
            hint="WhatsApp (chat.whatsapp.com/...) ou Telegram (t.me/...). Aparece como botão na confirmação da inscrição."
          >
            <Input
              id="groupUrl"
              name="groupUrl"
              type="url"
              placeholder="https://chat.whatsapp.com/... ou https://t.me/..."
              value={values.groupUrl}
              onChange={(e) => setValues((v) => ({ ...v, groupUrl: e.target.value }))}
            />
          </FieldGroup>
        </div>

        {/* Seção: Mensagens e Confirmação */}
        <div className="flex flex-col gap-4 rounded-lg border border-border-subtle p-4">
          <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-foreground-subtle">
            Mensagens e Confirmação
          </h3>

          <FieldGroup
            label="Mensagem de confirmação personalizada (opcional)"
            htmlFor="confirmationMessage"
            hint="Exibida após a inscrição confirmada. Se vazio, usa a mensagem padrão do sistema."
          >
            <Textarea
              id="confirmationMessage"
              name="confirmationMessage"
              value={values.confirmationMessage}
              onChange={(e) => setValues((v) => ({ ...v, confirmationMessage: e.target.value }))}
              placeholder="Inscrição realizada com sucesso! Entre no grupo do evento pelo botão abaixo para acompanhar as informações e novidades."
              rows={3}
              maxLength={1000}
            />
          </FieldGroup>
        </div>

        {/* Seção: Pop-up na entrada do site */}
        <div className="flex flex-col gap-4 rounded-lg border border-border-subtle p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-foreground-subtle">
              Pop-up na Entrada do Site
            </h3>
            <Switch
              label="Exibir como pop-up"
              name="showAsPopup"
              id="showAsPopup"
              checked={values.showAsPopup}
              onChange={(e) => setValues((v) => ({ ...v, showAsPopup: e.target.checked }))}
            />
          </div>

          {values.showAsPopup && (
            <>
              <FieldGroup
                label="Texto do botão de ação"
                htmlFor="popupButtonText"
                hint="Ex.: Saiba mais, Inscreva-se, Ver detalhes."
              >
                <Input
                  id="popupButtonText"
                  name="popupButtonText"
                  value={values.popupButtonText}
                  onChange={(e) => setValues((v) => ({ ...v, popupButtonText: e.target.value }))}
                  placeholder="Saiba mais"
                  maxLength={60}
                />
              </FieldGroup>

              <FieldGroup
                label="Link do botão"
                htmlFor="popupButtonUrl"
                hint="URL completa (https://...). O botão abre em nova aba."
              >
                <Input
                  id="popupButtonUrl"
                  name="popupButtonUrl"
                  type="url"
                  value={values.popupButtonUrl}
                  onChange={(e) => setValues((v) => ({ ...v, popupButtonUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </FieldGroup>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldGroup
                  label="Prioridade"
                  htmlFor="popupPriority"
                  hint="Maior valor = maior prioridade. Quando há múltiplos pop-ups elegíveis, o de maior prioridade é exibido."
                >
                  <Input
                    id="popupPriority"
                    name="popupPriority"
                    type="number"
                    min={0}
                    max={100}
                    value={values.popupPriority}
                    onChange={(e) => setValues((v) => ({ ...v, popupPriority: e.target.value }))}
                  />
                </FieldGroup>

                <FieldGroup
                  label="Frequência de exibição"
                  htmlFor="popupFrequency"
                >
                  <Select
                    id="popupFrequency"
                    name="popupFrequency"
                    value={values.popupFrequency}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        popupFrequency: e.target.value as "session" | "lifetime" | "visit",
                      }))
                    }
                  >
                    <option value="session">Uma vez por sessão</option>
                    <option value="lifetime">Uma vez durante a vigência</option>
                    <option value="visit">A cada nova visita</option>
                  </Select>
                </FieldGroup>
              </div>

              {/* Pré-visualização do pop-up */}
              <button
                type="button"
                onClick={() => {
                  const previewData = {
                    id: "__preview__",
                    title: values.title || "Título do aviso",
                    description: values.description || "Descrição do aviso.",
                    imageUrl: editing?.imageUrl ?? null,
                    popupButtonText: values.popupButtonText || null,
                    popupButtonUrl: values.popupButtonUrl || null,
                    startDate: new Date(),
                    endDate: null,
                    popupPriority: Number(values.popupPriority) || 0,
                    popupFrequency: values.popupFrequency,
                  };
                  // Abre modal de prévia usando o componente AnnouncementPopup em modo preview
                  window.dispatchEvent(
                    new CustomEvent("popup-preview", { detail: previewData })
                  );
                }}
                className="self-start rounded-lg border border-border-subtle px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-foreground-muted transition-colors hover:border-accent hover:text-accent"
              >
                Pré-visualizar pop-up
              </button>
            </>
          )}
        </div>

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
