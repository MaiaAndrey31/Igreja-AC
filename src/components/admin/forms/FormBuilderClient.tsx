"use client";

import { useActionState, useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react";
import { createFormAction, updateFormAction } from "@/actions/forms";
import type { ActionState } from "@/actions/auth";
import { FieldGroup, Input, Textarea, Select } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import type {
  DynamicFormField,
  DynamicFormFieldType,
  AvailabilityMode,
  FormPurpose,
} from "@/lib/forms/types";

// Re-export para uso no client (sem crypto node)
function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `field_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const FIELD_TYPES: { value: DynamicFormFieldType; label: string }[] = [
  { value: "text", label: "Texto curto" },
  { value: "textarea", label: "Texto longo" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone/WhatsApp" },
  { value: "number", label: "Número" },
  { value: "date", label: "Data" },
  { value: "select", label: "Lista suspensa" },
  { value: "multiselect", label: "Múltipla escolha" },
  { value: "radio", label: "Seleção única" },
  { value: "boolean", label: "Sim/Não" },
  { value: "consent", label: "Checkbox de consentimento" },
  { value: "file", label: "Upload de arquivo" },
];

const PURPOSES: { value: FormPurpose; label: string }[] = [
  { value: "evento", label: "Evento" },
  { value: "cadastro", label: "Cadastro" },
  { value: "pesquisa", label: "Pesquisa" },
  { value: "inscricao", label: "Inscrição geral" },
  { value: "solicitacao", label: "Solicitação" },
  { value: "outros", label: "Outros" },
];

interface FormBuilderProps {
  mode: "create" | "edit";
  formId?: string;
  initialData?: {
    title: string;
    description: string;
    slug: string;
    purpose: FormPurpose;
    fields: DynamicFormField[];
    availabilityMode: AvailabilityMode;
    opensAt: string;
    closesAt: string;
    durationHours: number | null;
    maxSubmissions: number | null;
    showRemainingSlots: boolean;
    eventRef: string;
  };
}

function emptyField(type: DynamicFormFieldType = "text"): DynamicFormField {
  return {
    id: generateId(),
    type,
    label: "",
    description: "",
    placeholder: "",
    required: false,
    options: [],
    validation: {},
    order: 0,
  };
}

export function FormBuilderClient({ mode, formId, initialData }: FormBuilderProps) {
  const router = useRouter();
  const { push } = useToast();

  const action = mode === "create" ? createFormAction : updateFormAction.bind(null, formId!);
  const [state, formAction] = useActionState(action, {} as ActionState);

  // Estado local do formulário
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [purpose, setPurpose] = useState<FormPurpose>(initialData?.purpose ?? "inscricao");
  const [fields, setFields] = useState<DynamicFormField[]>(
    initialData?.fields ?? [emptyField()]
  );
  const [availabilityMode, setAvailabilityMode] = useState<AvailabilityMode>(
    initialData?.availabilityMode ?? "manual"
  );
  const [opensAt, setOpensAt] = useState(initialData?.opensAt ?? "");
  const [closesAt, setClosesAt] = useState(initialData?.closesAt ?? "");
  const [durationHours, setDurationHours] = useState<number | null>(
    initialData?.durationHours ?? null
  );
  const [maxSubmissions, setMaxSubmissions] = useState<number | null>(
    initialData?.maxSubmissions ?? null
  );
  const [showRemainingSlots, setShowRemainingSlots] = useState(
    initialData?.showRemainingSlots ?? false
  );
  const [eventRef, setEventRef] = useState(initialData?.eventRef ?? "");
  const [publishing, setPublishing] = useState(false);

  // Handlers de campos
  const addField = useCallback(() => {
    setFields((prev) => [...prev, emptyField()]);
  }, []);

  const removeField = useCallback((index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveField = useCallback((index: number, direction: -1 | 1) => {
    setFields((prev) => {
      const next = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next.map((f, i) => ({ ...f, order: i }));
    });
  }, []);

  const updateField = useCallback(
    (index: number, updates: Partial<DynamicFormField>) => {
      setFields((prev) =>
        prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
      );
    },
    []
  );

  const addOption = useCallback((fieldIndex: number) => {
    setFields((prev) =>
      prev.map((f, i) => {
        if (i !== fieldIndex) return f;
        const options = [...(f.options ?? []), { id: generateId(), label: "" }];
        return { ...f, options };
      })
    );
  }, []);

  const updateOption = useCallback(
    (fieldIndex: number, optionIndex: number, label: string) => {
      setFields((prev) =>
        prev.map((f, i) => {
          if (i !== fieldIndex) return f;
          const options = (f.options ?? []).map((o, oi) =>
            oi === optionIndex ? { ...o, label } : o
          );
          return { ...f, options };
        })
      );
    },
    []
  );

  const removeOption = useCallback((fieldIndex: number, optionIndex: number) => {
    setFields((prev) =>
      prev.map((f, i) => {
        if (i !== fieldIndex) return f;
        const options = (f.options ?? []).filter((_, oi) => oi !== optionIndex);
        return { ...f, options };
      })
    );
  }, []);

  // Serializa os campos como JSON para enviar via FormData
  const serializedFields = JSON.stringify(fields);

  // Evita envio duplicado: rastreia se já processamos um sucesso anterior
  const successHandledRef = useRef(false);

  // Redirecionamento e toast em useEffect — NUNCA durante a renderização,
  // pois router.push() dentro do render causa crash no Next.js 16 / React 19
  // ("Cannot update during render"). O ref evita re-executar em re-renders.
  useEffect(() => {
    if (state.success && !successHandledRef.current) {
      successHandledRef.current = true;
      push(mode === "create" ? "Formulário criado." : "Formulário atualizado.");
      if (mode === "create") {
        router.push("/admin/formularios");
      }
    }
    // Reseta quando o state muda (ex.: novo submit falha após sucesso anterior)
    if (!state.success) {
      successHandledRef.current = false;
    }
  }, [state.success, mode, push, router]);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {/* Metadados */}
      <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-6">
        <h2 className="font-display text-lg text-foreground">Informações gerais</h2>

        <FieldGroup label="Título" htmlFor="title">
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Ex.: Inscrição Retiro de Jovens 2026"
          />
        </FieldGroup>

        <FieldGroup label="Descrição (opcional)" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva a finalidade deste formulário."
          />
        </FieldGroup>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldGroup
            label="Slug (URL pública)"
            htmlFor="slug"
            hint="Apenas letras minúsculas, números e hífens. Ex.: retiro-jovens-2026"
          >
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              required
              placeholder="retiro-jovens-2026"
            />
          </FieldGroup>

          <FieldGroup label="Finalidade" htmlFor="purpose">
            <Select
              id="purpose"
              name="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as FormPurpose)}
            >
              {PURPOSES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </FieldGroup>
        </div>

        <FieldGroup label="Referência a evento (opcional)" htmlFor="eventRef">
          <Input
            id="eventRef"
            name="eventRef"
            value={eventRef}
            onChange={(e) => setEventRef(e.target.value)}
            placeholder="ID ou link do evento associado"
          />
        </FieldGroup>
      </section>

      {/* Campos dinâmicos */}
      <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-6">
        <h2 className="font-display text-lg text-foreground">Campos do formulário</h2>

        <input type="hidden" name="fields" value={serializedFields} />

        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <FieldEditor
              key={field.id}
              field={field}
              index={index}
              total={fields.length}
              onUpdate={(updates) => updateField(index, updates)}
              onRemove={() => removeField(index)}
              onMove={(dir) => moveField(index, dir)}
              onAddOption={() => addOption(index)}
              onUpdateOption={(oi, label) => updateOption(index, oi, label)}
              onRemoveOption={(oi) => removeOption(index, oi)}
            />
          ))}
        </div>

        {fields.length === 0 && (
          <p className="py-4 text-center text-sm text-foreground-subtle">
            Adicione pelo menos um campo ao formulário.
          </p>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={addField}
            className="flex items-center gap-2 rounded-lg border border-border-soft px-3 py-1.5 text-xs text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <Plus size={14} />
            Adicionar campo
          </button>
        </div>
      </section>

      {/* Disponibilidade */}
      <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-6">
        <h2 className="font-display text-lg text-foreground">Disponibilidade</h2>

        <FieldGroup label="Modo de disponibilidade" htmlFor="availabilityMode">
          <Select
            id="availabilityMode"
            name="availabilityMode"
            value={availabilityMode}
            onChange={(e) => setAvailabilityMode(e.target.value as AvailabilityMode)}
          >
            <option value="manual">Manual (ativar/desativar quando quiser)</option>
            <option value="scheduled">Agendado (data e hora de abertura/encerramento)</option>
            <option value="duration">Por duração (horas após ativação)</option>
          </Select>
        </FieldGroup>

        {availabilityMode === "scheduled" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldGroup label="Abertura" htmlFor="opensAt">
              <Input
                id="opensAt"
                name="opensAt"
                type="datetime-local"
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Encerramento" htmlFor="closesAt">
              <Input
                id="closesAt"
                name="closesAt"
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
              />
            </FieldGroup>
          </div>
        )}

        {availabilityMode === "duration" && (
          <FieldGroup label="Duração (horas)" htmlFor="durationHours">
            <Input
              id="durationHours"
              name="durationHours"
              type="number"
              min={1}
              max={8760}
              value={durationHours ?? ""}
              onChange={(e) => setDurationHours(Number(e.target.value) || null)}
              placeholder="Ex.: 72 (3 dias)"
            />
          </FieldGroup>
        )}
      </section>

      {/* Limites */}
      <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-6">
        <h2 className="font-display text-lg text-foreground">Limites de inscrição</h2>

        <FieldGroup
          label="Limite máximo de inscrições (opcional)"
          htmlFor="maxSubmissions"
          hint="Deixe em branco para ilimitado."
        >
          <Input
            id="maxSubmissions"
            name="maxSubmissions"
            type="number"
            min={1}
            value={maxSubmissions ?? ""}
            onChange={(e) => setMaxSubmissions(Number(e.target.value) || null)}
            placeholder="Ex.: 100"
          />
        </FieldGroup>

        <Switch
          label="Mostrar vagas restantes no formulário público"
          name="showRemainingSlots"
          id="showRemainingSlots"
          checked={showRemainingSlots}
          onChange={(e) => setShowRemainingSlots(e.target.checked)}
        />
      </section>

      {/* Erro e ações */}
      {state.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton className="flex-1">
          {mode === "create" ? "Criar formulário" : "Salvar alterações"}
        </SubmitButton>

        {mode === "edit" && (
          <button
            type="submit"
            onClick={() => setPublishing(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-accent bg-accent px-6 py-3 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent/90"
          >
            <Save size={16} />
            Salvar e publicar
          </button>
        )}
      </div>

      {/* Campo oculto para indicar publicação */}
      {publishing && <input type="hidden" name="publish" value="true" />}
    </form>
  );
}

// ---------------------------------------------------------------------------
// Editor individual de campo
// ---------------------------------------------------------------------------

function FieldEditor({
  field,
  index,
  total,
  onUpdate,
  onRemove,
  onMove,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: {
  field: DynamicFormField;
  index: number;
  total: number;
  onUpdate: (updates: Partial<DynamicFormField>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onAddOption: () => void;
  onUpdateOption: (optionIndex: number, label: string) => void;
  onRemoveOption: (optionIndex: number) => void;
}) {
  const [expanded, setExpanded] = useState(!field.label);
  const hasOptions = ["select", "multiselect", "radio"].includes(field.type);

  return (
    <div className="rounded-lg border border-border-subtle bg-background p-4">
      {/* Cabeçalho do campo */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="rounded p-0.5 text-foreground-subtle hover:text-foreground disabled:opacity-30"
          >
            <ChevronUp size={14} />
          </button>
          <GripVertical size={14} className="text-foreground-subtle" />
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="rounded p-0.5 text-foreground-subtle hover:text-foreground disabled:opacity-30"
          >
            <ChevronDown size={14} />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-foreground-subtle">
              {FIELD_TYPES.find((t) => t.value === field.type)?.label ?? field.type}
            </span>
            {field.required && (
              <span className="text-[10px] font-medium text-accent">Obrigatório</span>
            )}
          </div>
          <p className="truncate text-sm font-medium text-foreground">
            {field.label || "(sem rótulo)"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-red-950/30 hover:text-red-300"
          title="Remover campo"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Editor expandido */}
      {expanded && (
        <div className="mt-4 flex flex-col gap-3 border-t border-border-subtle pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FieldGroup label="Tipo" htmlFor={`type-${field.id}`}>
              <Select
                id={`type-${field.id}`}
                value={field.type}
                onChange={(e) => onUpdate({ type: e.target.value as DynamicFormFieldType })}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </FieldGroup>

            <FieldGroup label="Rótulo" htmlFor={`label-${field.id}`}>
              <Input
                id={`label-${field.id}`}
                value={field.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                placeholder="Ex.: Nome completo"
                required
              />
            </FieldGroup>
          </div>

          <FieldGroup label="Descrição auxiliar (opcional)" htmlFor={`desc-${field.id}`}>
            <Input
              id={`desc-${field.id}`}
              value={field.description ?? ""}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Texto de ajuda exibido abaixo do rótulo"
            />
          </FieldGroup>

          {(field.type === "text" || field.type === "textarea" || field.type === "email" || field.type === "phone") && (
            <FieldGroup label="Placeholder (opcional)" htmlFor={`placeholder-${field.id}`}>
              <Input
                id={`placeholder-${field.id}`}
                value={field.placeholder ?? ""}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                placeholder="Texto exibido quando o campo está vazio"
              />
            </FieldGroup>
          )}

          <Switch
            label="Campo obrigatório"
            checked={field.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
          />

          {/* Opções para campos de seleção */}
          {hasOptions && (
            <div className="flex flex-col gap-2 rounded-lg border border-border-subtle p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Opções</span>
                <button
                  type="button"
                  onClick={onAddOption}
                  className="flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  <Plus size={12} />
                  Adicionar opção
                </button>
              </div>

              {(field.options ?? []).map((option, oi) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Input
                    value={option.label}
                    onChange={(e) => onUpdateOption(oi, e.target.value)}
                    placeholder={`Opção ${oi + 1}`}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveOption(oi)}
                    className="shrink-0 rounded p-1.5 text-foreground-subtle hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {(field.options ?? []).length === 0 && (
                <p className="text-xs text-foreground-subtle">
                  Adicione pelo menos uma opção.
                </p>
              )}
            </div>
          )}

          {/* Validações específicas por tipo */}
          {(field.type === "text" || field.type === "textarea") && (
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Mín. caracteres" htmlFor={`minLen-${field.id}`}>
                <Input
                  id={`minLen-${field.id}`}
                  type="number"
                  min={0}
                  value={field.validation?.minLength ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...field.validation,
                        minLength: Number(e.target.value) || undefined,
                      },
                    })
                  }
                />
              </FieldGroup>
              <FieldGroup label="Máx. caracteres" htmlFor={`maxLen-${field.id}`}>
                <Input
                  id={`maxLen-${field.id}`}
                  type="number"
                  min={1}
                  value={field.validation?.maxLength ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...field.validation,
                        maxLength: Number(e.target.value) || undefined,
                      },
                    })
                  }
                />
              </FieldGroup>
            </div>
          )}

          {field.type === "number" && (
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Valor mínimo" htmlFor={`min-${field.id}`}>
                <Input
                  id={`min-${field.id}`}
                  type="number"
                  value={field.validation?.min ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...field.validation,
                        min: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                />
              </FieldGroup>
              <FieldGroup label="Valor máximo" htmlFor={`max-${field.id}`}>
                <Input
                  id={`max-${field.id}`}
                  type="number"
                  value={field.validation?.max ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...field.validation,
                        max: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                />
              </FieldGroup>
            </div>
          )}

          {field.type === "file" && (
            <div className="flex flex-col gap-3">
              <FieldGroup
                label="Tamanho máximo (MB)"
                htmlFor={`maxSize-${field.id}`}
                hint="Padrão: 5MB. Máximo permitido: 10MB."
              >
                <Input
                  id={`maxSize-${field.id}`}
                  type="number"
                  min={1}
                  max={10}
                  value={
                    field.validation?.maxFileSizeBytes
                      ? Math.round(field.validation.maxFileSizeBytes / (1024 * 1024))
                      : ""
                  }
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...field.validation,
                        maxFileSizeBytes: e.target.value
                          ? Number(e.target.value) * 1024 * 1024
                          : undefined,
                      },
                    })
                  }
                />
              </FieldGroup>
            </div>
          )}
        </div>
      )}
    </div>
  );
}