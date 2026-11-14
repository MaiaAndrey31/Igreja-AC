"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createEventAction,
  updateEventAction,
  deleteEventAction,
  duplicateEventAction,
} from "@/actions/events";
import type { ActionState } from "@/actions/auth";
import { AdminListHeader } from "@/components/admin/AdminListHeader";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Modal } from "@/components/ui/Modal";
import { FieldGroup, Input, Textarea, Select } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { formatEventDate } from "@/lib/format";
import { Copy, ExternalLink, Users, X } from "lucide-react";
/**
 * DTO mínimo de formulário para o seletor de vinculação.
 * Deve corresponder ao tipo definido na página do servidor
 * (src/app/admin/(dashboard)/eventos/page.tsx) para evitar
 * passar objetos DynamicForm completos com Timestamps não serializáveis.
 */
export interface EventFormOption {
  id: string;
  title: string;
  submissionCount: number;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  instagramUrl: string | null;
  category: string;
  startDate: Date;
  endDate: Date | null;
  published: boolean;
  featured: boolean;
  slug: string | null;
  address: string | null;
  formId: string | null;
  maxSubmissions: number | null;
  submissionCount: number;
  visualId: string | null;
  groupUrl: string | null;
  confirmationMessage: string | null;
}

const emptyState: ActionState = {};

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Gera slug seguro para URL a partir de texto livre. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

interface EventManagerProps {
  items: EventItem[];
  forms: EventFormOption[];
}

export function EventManager({ items, forms }: EventManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [modalInstance, setModalInstance] = useState(0);
  const { push } = useToast();

  function openModal(item: EventItem | null) {
    setEditing(item);
    setModalInstance((n) => n + 1);
    setModalOpen(true);
  }

  async function handleDuplicate(id: string, title: string) {
    const result = await duplicateEventAction(id);
    if (result.success) {
      push(`Evento "${title}" duplicado como rascunho.`);
    } else if (result.error) {
      push(result.error);
    }
  }

  const [search, setSearch] = useState("");
  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <AdminListHeader
        title="Eventos"
        description="Gerencie eventos, inscrições e destaques na página inicial."
        actionLabel="Novo evento"
        onAction={() => openModal(null)}
      />

      {/* Filtros */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Buscar evento…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border-subtle bg-surface px-4 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none sm:max-w-xs"
        />
        <span className="text-xs text-foreground-subtle">
          {filtered.length} de {items.length} eventos
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface px-5 py-4 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-accent">
                <span>{item.category}</span>
                <span className="text-foreground-subtle">
                  · {formatEventDate(item.startDate)}
                </span>
                {item.featured && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[9px] font-bold text-accent">
                    Destaque
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-sm font-medium text-foreground">
                {item.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
                {item.slug && (
                  <a
                    href={`/eventos/${item.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 transition-colors hover:text-accent"
                  >
                    <ExternalLink size={11} />
                    /eventos/{item.slug}
                  </a>
                )}
                {item.formId && (
                  <span className="inline-flex items-center gap-1">
                    <Users size={11} />
                    {item.submissionCount}
                    {item.maxSubmissions ? `/${item.maxSubmissions}` : ""} inscritos
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {!item.published && (
                <span className="rounded-full border border-border-soft px-2.5 py-1 text-[10px] uppercase tracking-wider text-foreground-subtle">
                  Rascunho
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDuplicate(item.id, item.title)}
                title="Duplicar evento"
                className="shrink-0 rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <Copy size={14} />
              </button>
              <button
                type="button"
                onClick={() => openModal(item)}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                Editar
              </button>
              <DeleteButton
                confirmMessage={`Excluir o evento "${item.title}"?`}
                action={() => deleteEventAction(item.id)}
              />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-foreground-subtle">
            {items.length === 0
              ? "Nenhum evento cadastrado ainda."
              : "Nenhum evento encontrado para esta busca."}
          </p>
        )}
      </div>

      <EventModal
        key={modalInstance}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        forms={forms}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulário do evento
// ---------------------------------------------------------------------------

interface EventFormValues {
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  published: boolean;
  featured: boolean;
  slug: string;
  address: string;
  formId: string;
  maxSubmissions: string;
  visualId: string;
  groupUrl: string;
  confirmationMessage: string;
  instagramUrl: string;
}

function toFormValues(editing: EventItem | null): EventFormValues {
  return {
    title: editing?.title ?? "",
    description: editing?.description ?? "",
    category: editing?.category ?? "Outro",
    startDate: editing ? toDateInputValue(editing.startDate) : "",
    endDate: editing?.endDate ? toDateInputValue(editing.endDate) : "",
    published: editing?.published ?? true,
    featured: editing?.featured ?? false,
    slug: editing?.slug ?? "",
    address: editing?.address ?? "",
    formId: editing?.formId ?? "",
    maxSubmissions: editing?.maxSubmissions ? String(editing.maxSubmissions) : "",
    visualId: editing?.visualId ?? "",
    groupUrl: editing?.groupUrl ?? "",
    confirmationMessage: editing?.confirmationMessage ?? "",
    instagramUrl: editing?.instagramUrl ?? "",
  };
}

function EventModal({
  open,
  onClose,
  editing,
  forms,
}: {
  open: boolean;
  onClose: () => void;
  editing: EventItem | null;
  forms: EventFormOption[];
}) {
  const action = editing
    ? updateEventAction.bind(null, editing.id)
    : createEventAction;
  const [state, formAction] = useActionState(action, emptyState);
  const { push } = useToast();
  const [values, setValues] = useState<EventFormValues>(() =>
    toFormValues(editing)
  );

  // Estado do arquivo selecionado — preservado entre re-renders após erro de validação.
  // O <input type="file"> não é controlado pelo React; sem este estado, o navegador
  // limpa o input a cada re-render, forçando o admin a re-selecionar a imagem.
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    editing?.imageUrl ?? null
  );

  // Libera URL.createObjectURL anterior quando previewUrl muda ou componente desmonta
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    // Cria prévia local imediata — liberada no cleanup do useEffect acima
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  function handleRemoveImage() {
    setSelectedFile(null);
    setPreviewUrl(editing?.imageUrl ?? null);
  }

  useEffect(() => {
    if (state.success) {
      push(editing ? "Evento atualizado." : "Evento criado.");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  function handleTitleChange(value: string) {
    setValues((v) => {
      const shouldAutoSlug = !editing || !v.slug || v.slug === slugify(v.title);
      return {
        ...v,
        title: value,
        ...(shouldAutoSlug ? { slug: slugify(value) } : {}),
      };
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar evento" : "Novo evento"}
      maxWidthClassName="max-w-2xl"
    >
      <form action={formAction} className="flex flex-col gap-4">
        {/* Informações básicas */}
        <div className="flex flex-col gap-4 rounded-lg border border-border-subtle p-4">
          <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-foreground-subtle">
            Informações Básicas
          </h3>

          <FieldGroup label="Título" htmlFor="title">
            <Input
              id="title"
              name="title"
              value={values.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
          </FieldGroup>

          <FieldGroup
            label="Slug da URL"
            htmlFor="slug"
            hint="Usado em /eventos/[slug]. Apenas letras minúsculas, números e hífens."
          >
            <Input
              id="slug"
              name="slug"
              value={values.slug}
              onChange={(e) => setValues((v) => ({ ...v, slug: e.target.value }))}
              required
              placeholder="retiro-jovens-2026"
            />
          </FieldGroup>

          <FieldGroup label="Descrição" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              value={values.description}
              onChange={(e) =>
                setValues((v) => ({ ...v, description: e.target.value }))
              }
              required
              rows={4}
            />
          </FieldGroup>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldGroup label="Categoria" htmlFor="category">
              <Select
                id="category"
                name="category"
                value={values.category}
                onChange={(e) =>
                  setValues((v) => ({ ...v, category: e.target.value }))
                }
              >
                <option value="Culto especial">Culto especial</option>
                <option value="Conferência">Conferência</option>
                <option value="Retiro">Retiro</option>
                <option value="Workshop">Workshop</option>
                <option value="Outro">Outro</option>
              </Select>
            </FieldGroup>

            <FieldGroup label="Endereço / Local" htmlFor="address">
              <Input
                id="address"
                name="address"
                value={values.address}
                onChange={(e) =>
                  setValues((v) => ({ ...v, address: e.target.value }))
                }
                placeholder="Av. Exemplo, 123 — Cidade/SP"
              />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Data de início" htmlFor="startDate">
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={values.startDate}
                onChange={(e) =>
                  setValues((v) => ({ ...v, startDate: e.target.value }))
                }
                required
              />
            </FieldGroup>
            <FieldGroup label="Data final (opcional)" htmlFor="endDate">
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={values.endDate}
                onChange={(e) =>
                  setValues((v) => ({ ...v, endDate: e.target.value }))
                }
              />
            </FieldGroup>
          </div>
        </div>

        {/* Identidade Visual */}
        <div className="flex flex-col gap-4 rounded-lg border border-border-subtle p-4">
          <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-foreground-subtle">
            Identidade Visual
          </h3>

          {/* Pré-visualização persistente — sobrevive a re-renders após erro de validação */}
          {previewUrl && (
            <div className="relative overflow-hidden rounded-lg border border-border-subtle bg-surface-2">
              <img
                src={previewUrl}
                alt="Prévia do banner"
                className="aspect-[16/9] w-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
                title="Remover imagem"
              >
                <X size={14} />
              </button>
              <p className="px-3 py-2 text-[11px] text-foreground-subtle">
                {selectedFile ? selectedFile.name : "Imagem salva"}
              </p>
            </div>
          )}

          <FieldGroup
            label="Banner do evento"
            htmlFor="imageFile"
            hint="JPG, PNG ou WebP, até 8MB. Aparece na página do evento e nos cartões."
          >
            <input
              id="imageFile"
              name="imageFile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelect}
              className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-[11px] file:font-medium file:uppercase file:tracking-wider file:text-accent-contrast hover:file:bg-accent/90 focus:border-accent focus:outline-none"
            />
          </FieldGroup>

          <FieldGroup
            label="ID Visual (opcional)"
            htmlFor="visualId"
            hint="Identificação interna da organização (ex.: EVT-2026-RET)."
          >
            <Input
              id="visualId"
              name="visualId"
              value={values.visualId}
              onChange={(e) =>
                setValues((v) => ({ ...v, visualId: e.target.value }))
              }
              placeholder="EVT-2026-RET-JOVENS"
              maxLength={60}
            />
          </FieldGroup>
        </div>

        {/* Inscrições e Formulário */}
        <div className="flex flex-col gap-4 rounded-lg border border-border-subtle p-4">
          <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-foreground-subtle">
            Inscrições
          </h3>

          <FieldGroup
            label="Formulário de inscrição"
            htmlFor="formId"
            hint="Vincule um formulário existente para coletar inscrições."
          >
            <Select
              id="formId"
              name="formId"
              value={values.formId}
              onChange={(e) =>
                setValues((v) => ({ ...v, formId: e.target.value }))
              }
            >
              <option value="">Sem formulário vinculado</option>
              {forms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.title} ({form.submissionCount} respostas)
                </option>
              ))}
            </Select>
          </FieldGroup>

          <FieldGroup
            label="Limite de vagas (opcional)"
            htmlFor="maxSubmissions"
            hint="Deixe em branco para inscrições ilimitadas."
          >
            <Input
              id="maxSubmissions"
              name="maxSubmissions"
              type="number"
              min={1}
              value={values.maxSubmissions}
              onChange={(e) =>
                setValues((v) => ({ ...v, maxSubmissions: e.target.value }))
              }
              placeholder="Ex.: 100"
            />
          </FieldGroup>

          {editing?.formId && (
            <div className="flex items-center gap-2 rounded-lg bg-surface-2 px-4 py-3 text-xs text-foreground-muted">
              <Users size={14} className="shrink-0 text-accent" />
              <span>
                {editing.submissionCount}
                {editing.maxSubmissions
                  ? ` de ${editing.maxSubmissions}`
                  : ""}{" "}
                inscrições recebidas
              </span>
              {editing.formId && (
                <a
                  href={`/admin/formularios/${editing.formId}/respostas`}
                  className="ml-auto underline hover:text-accent"
                >
                  Ver respostas
                </a>
              )}
            </div>
          )}
        </div>

        {/* Integrações */}
        <div className="flex flex-col gap-4 rounded-lg border border-border-subtle p-4">
          <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-foreground-subtle">
            Integrações e Links
          </h3>

          <FieldGroup
            label="Link do grupo (WhatsApp/Telegram)"
            htmlFor="groupUrl"
            hint="Aparece como botão na página do evento."
          >
            <Input
              id="groupUrl"
              name="groupUrl"
              type="url"
              placeholder="https://chat.whatsapp.com/... ou https://t.me/..."
              value={values.groupUrl}
              onChange={(e) =>
                setValues((v) => ({ ...v, groupUrl: e.target.value }))
              }
            />
          </FieldGroup>

          <FieldGroup
            label="Link do Instagram (opcional)"
            htmlFor="instagramUrl"
            hint="Post ou reel de divulgação."
          >
            <Input
              id="instagramUrl"
              name="instagramUrl"
              type="url"
              placeholder="https://www.instagram.com/reel/..."
              value={values.instagramUrl}
              onChange={(e) =>
                setValues((v) => ({ ...v, instagramUrl: e.target.value }))
              }
            />
          </FieldGroup>

          <FieldGroup
            label="Mensagem de confirmação (opcional)"
            htmlFor="confirmationMessage"
            hint="Exibida após inscrição confirmada."
          >
            <Textarea
              id="confirmationMessage"
              name="confirmationMessage"
              value={values.confirmationMessage}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  confirmationMessage: e.target.value,
                }))
              }
              placeholder="Inscrição realizada com sucesso! Entre no grupo do evento para acompanhar as novidades."
              rows={3}
              maxLength={1000}
            />
          </FieldGroup>
        </div>

        {/* Publicação e Destaque */}
        <Switch
          label="Publicado no site"
          name="published"
          id="published"
          checked={values.published}
          onChange={(e) =>
            setValues((v) => ({ ...v, published: e.target.checked }))
          }
        />

        <Switch
          label="Destacar na página inicial"
          name="featured"
          id="featured"
          checked={values.featured}
          onChange={(e) =>
            setValues((v) => ({ ...v, featured: e.target.checked }))
          }
        />

        {state.error && <p className="text-sm text-red-400">{state.error}</p>}

        <SubmitButton className="mt-2">
          {editing ? "Salvar alterações" : "Criar evento"}
        </SubmitButton>
      </form>
    </Modal>
  );
}