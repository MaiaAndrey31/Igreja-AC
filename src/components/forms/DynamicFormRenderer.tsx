"use client";

import { useActionState, useState, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, X, Loader2 } from "lucide-react";
import { submitDynamicFormAction } from "@/actions/dynamicSubmissions";
import { uploadFormFileAction } from "@/actions/formUploads";
import type { ActionState } from "@/actions/auth";
import type { DynamicForm, DynamicFormField } from "@/lib/forms/types";
import { FieldGroup, Input, Textarea, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Switch } from "@/components/ui/Switch";

interface DynamicFormRendererProps {
  form: DynamicForm;
  remainingSlots: number | null;
}

export function DynamicFormRenderer({
  form,
  remainingSlots,
}: DynamicFormRendererProps) {
  const action = submitDynamicFormAction.bind(null, form.slug);
  const [state, formAction] = useActionState(action, {} as ActionState);

  if (state.success) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 text-center">
        <CheckCircle2 size={48} className="text-green-400" />
        <h1 className="mt-6 font-display text-3xl text-foreground">
          Inscrição recebida!
        </h1>
        <p className="mt-4 text-lg text-foreground-muted">
          Obrigado por se inscrever em <strong>{form.title}</strong>. Entraremos
          em contato em breve.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-lg border border-border-soft px-6 py-3 text-sm text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          Voltar ao início
        </Link>
      </div>
    );
  }

  const fields = form.publishedFieldsSnapshot ?? form.fields;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      {/* Cabeçalho */}
      <header className="mb-10">
        <h1 className="font-display text-3xl text-foreground sm:text-4xl">
          {form.title}
        </h1>
        {form.description && (
          <p className="mt-4 text-lg text-foreground-muted">{form.description}</p>
        )}
        {remainingSlots !== null && (
          <p className="mt-3 font-data text-sm text-accent">
            {remainingSlots} {remainingSlots === 1 ? "vaga restante" : "vagas restantes"}
          </p>
        )}
      </header>

      {/* Formulário */}
      <form action={formAction} className="flex flex-col gap-6">
        {/* Honeypot — campo oculto que só bots preenchem */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -z-10 h-0 w-0 opacity-0"
        />

        {fields.map((field) => (
          <FormFieldRenderer key={field.id} field={field} formSlug={form.slug} />
        ))}

        {state.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}

        <SubmitButton className="mt-4 w-full sm:w-auto">
          Enviar inscrição
        </SubmitButton>

        <p className="text-xs text-foreground-subtle">
          Seus dados serão tratados conforme nossa política de privacidade e
          utilizados exclusivamente para a finalidade deste formulário.
        </p>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Renderizador individual de campo
// ---------------------------------------------------------------------------

function FormFieldRenderer({ field, formSlug }: { field: DynamicFormField; formSlug: string }) {
  const isRequired = field.required;

  switch (field.type) {
    case "text":
      return (
        <FieldGroup label={field.label} htmlFor={field.id} hint={field.description}>
          <Input
            id={field.id}
            name={field.id}
            type="text"
            placeholder={field.placeholder}
            required={isRequired}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            pattern={field.validation?.pattern}
          />
        </FieldGroup>
      );

    case "textarea":
      return (
        <FieldGroup label={field.label} htmlFor={field.id} hint={field.description}>
          <Textarea
            id={field.id}
            name={field.id}
            placeholder={field.placeholder}
            required={isRequired}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
          />
        </FieldGroup>
      );

    case "email":
      return (
        <FieldGroup label={field.label} htmlFor={field.id} hint={field.description}>
          <Input
            id={field.id}
            name={field.id}
            type="email"
            placeholder={field.placeholder || "seu@email.com"}
            required={isRequired}
          />
        </FieldGroup>
      );

    case "phone":
      return (
        <FieldGroup label={field.label} htmlFor={field.id} hint={field.description}>
          <Input
            id={field.id}
            name={field.id}
            type="tel"
            placeholder={field.placeholder || "(00) 00000-0000"}
            required={isRequired}
          />
        </FieldGroup>
      );

    case "number":
      return (
        <FieldGroup label={field.label} htmlFor={field.id} hint={field.description}>
          <Input
            id={field.id}
            name={field.id}
            type="number"
            required={isRequired}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        </FieldGroup>
      );

    case "date":
      return (
        <FieldGroup label={field.label} htmlFor={field.id} hint={field.description}>
          <Input
            id={field.id}
            name={field.id}
            type="date"
            required={isRequired}
          />
        </FieldGroup>
      );

    case "select":
      return (
        <FieldGroup label={field.label} htmlFor={field.id} hint={field.description}>
          <Select id={field.id} name={field.id} required={isRequired}>
            <option value="">Selecione uma opção</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FieldGroup>
      );

    case "radio":
      return (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground">
            {field.label}
            {isRequired && <span className="ml-1 text-accent">*</span>}
          </legend>
          {field.description && (
            <p className="text-xs text-foreground-subtle">{field.description}</p>
          )}
          {(field.options ?? []).map((opt) => (
            <label
              key={opt.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border-subtle bg-surface px-4 py-3 transition-colors hover:bg-surface-2 has-[:checked]:border-accent has-[:checked]:bg-accent/10"
            >
              <input
                type="radio"
                name={field.id}
                value={opt.id}
                required={isRequired}
                className="accent-accent"
              />
              <span className="text-sm text-foreground">{opt.label}</span>
            </label>
          ))}
        </fieldset>
      );

    case "multiselect":
      return (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground">
            {field.label}
            {isRequired && <span className="ml-1 text-accent">*</span>}
          </legend>
          {field.description && (
            <p className="text-xs text-foreground-subtle">{field.description}</p>
          )}
          {(field.options ?? []).map((opt) => (
            <label
              key={opt.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border-subtle bg-surface px-4 py-3 transition-colors hover:bg-surface-2 has-[:checked]:border-accent has-[:checked]:bg-accent/10"
            >
              <input
                type="checkbox"
                name={field.id}
                value={opt.id}
                className="accent-accent"
              />
              <span className="text-sm text-foreground">{opt.label}</span>
            </label>
          ))}
        </fieldset>
      );

    case "boolean":
      return (
        <Switch
          label={field.label}
          name={field.id}
          id={field.id}
          checked={false}
          onChange={() => {}}
        />
      );

    case "consent":
      return (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-subtle bg-surface px-4 py-3 transition-colors hover:bg-surface-2">
          <input
            type="checkbox"
            name={field.id}
            required={isRequired}
            className="mt-0.5 accent-accent"
          />
          <span className="text-sm text-foreground">
            {field.label}
            {isRequired && <span className="ml-1 text-accent">*</span>}
          </span>
        </label>
      );

    case "file":
      return (
        <FileUploadField
          key={field.id}
          field={field}
          formSlug={formSlug}
          isRequired={isRequired}
        />
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Upload de arquivo com progresso e feedback
// ---------------------------------------------------------------------------

function FileUploadField({
  field,
  formSlug,
  isRequired,
}: {
  field: DynamicFormField;
  formSlug: string;
  isRequired: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append(field.id, file);

    try {
      // Chama a Server Action de upload público diretamente
      const result = await uploadFormFileAction(formSlug, field.id, {}, formData);
      if (result.error) {
        setError(result.error);
        setUploadedUrl(null);
        // Limpa o input para permitir nova tentativa
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else if (result.url) {
        setUploadedUrl(result.url);
      }
    } catch {
      setError("Falha ao enviar o arquivo. Tente novamente.");
      setUploadedUrl(null);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setUploadedUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const maxMB = field.validation?.maxFileSizeBytes
    ? Math.round(field.validation.maxFileSizeBytes / (1024 * 1024))
    : 10;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">
        {field.label}
        {isRequired && <span className="ml-1 text-accent">*</span>}
      </label>
      {(field.description || maxMB) && (
        <p className="text-xs text-foreground-subtle">
          {field.description}
          {field.description && maxMB ? " · " : ""}
          {maxMB ? `Máximo: ${maxMB}MB` : ""}
        </p>
      )}

      {/* Campo oculto com a URL do arquivo enviado — é este valor que vai na submissão */}
      <input type="hidden" name={field.id} value={uploadedUrl ?? ""} />

      {uploadedUrl ? (
        <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
          <CheckCircle2 size={16} className="shrink-0 text-green-400" />
          <span className="min-w-0 flex-1 truncate text-sm text-foreground">
            Arquivo enviado com sucesso
          </span>
          <button
            type="button"
            onClick={handleRemove}
            className="shrink-0 rounded p-1 text-foreground-muted transition-colors hover:text-red-300"
            title="Remover arquivo"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={fileInputRef}
            id={field.id}
            type="file"
            disabled={uploading}
            required={isRequired && !uploadedUrl}
            accept={field.validation?.allowedMimeTypes?.join(",") || "image/jpeg,image/png,image/webp,application/pdf"}
            onChange={handleFileChange}
            className="w-full rounded-lg border border-border-subtle bg-surface px-4 py-3 text-sm text-foreground file:mr-4 file:rounded-md file:border-0 file:bg-accent file:px-4 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-wider file:text-accent-contrast hover:file:bg-accent/90 focus:border-accent focus:outline-none disabled:opacity-50"
          />
          {uploading && (
            <div className="absolute inset-y-0 right-3 flex items-center">
              <Loader2 size={16} className="animate-spin text-foreground-subtle" />
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}