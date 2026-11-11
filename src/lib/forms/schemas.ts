import { z } from "zod";
import type { DynamicFormField, DynamicFormFieldType } from "./types";

// ---------------------------------------------------------------------------
// Schemas de campos individuais
// ---------------------------------------------------------------------------

const selectOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).max(120),
});

const fieldValidationSchema = z.object({
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().max(200).optional(),
  allowedMimeTypes: z.array(z.string().max(100)).max(20).optional(),
  maxFileSizeBytes: z.number().int().min(1).optional(),
});

export const dynamicFormFieldSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.enum([
    "text",
    "textarea",
    "email",
    "phone",
    "number",
    "date",
    "select",
    "multiselect",
    "radio",
    "boolean",
    "consent",
    "file",
  ] satisfies DynamicFormFieldType[]),
  label: z.string().trim().min(1, "Informe o rótulo do campo.").max(120),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  placeholder: z.string().trim().max(120).optional().or(z.literal("")),
  required: z.boolean().default(false),
  options: z.array(selectOptionSchema).max(50).optional(),
  validation: fieldValidationSchema.optional(),
  order: z.number().int().min(0).default(0),
});

// ---------------------------------------------------------------------------
// Schema do formulário (metadados + estrutura)
// ---------------------------------------------------------------------------

export const dynamicFormSchema = z.object({
  title: z.string().trim().min(2, "Informe um título.").max(140),
  description: z.string().trim().max(800).optional().or(z.literal("")),
  slug: z
    .string()
    .trim()
    .min(2, "Informe um slug.")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens."),
  purpose: z.enum(["evento", "cadastro", "pesquisa", "inscricao", "solicitacao", "outros"]),
  fields: z.array(dynamicFormFieldSchema).min(1, "Adicione pelo menos um campo.").max(40),
  availabilityMode: z.enum(["manual", "scheduled", "duration"]),
  opensAt: z.coerce.date().optional().nullable(),
  closesAt: z.coerce.date().optional().nullable(),
  durationHours: z.coerce.number().int().min(1).max(8760).optional().nullable(),
  maxSubmissions: z.coerce.number().int().min(1).optional().nullable(),
  showRemainingSlots: z.coerce.boolean().default(false),
  eventRef: z.string().trim().max(200).optional().or(z.literal("")),
});

/** Refinamentos cruzados aplicados após o parse básico. */
export const dynamicFormSchemaWithRefinements = dynamicFormSchema
  .refine(
    (data) => {
      if (data.availabilityMode === "scheduled") {
        return data.opensAt != null || data.closesAt != null;
      }
      return true;
    },
    { message: "Modo agendado exige data de abertura ou encerramento.", path: ["opensAt"] }
  )
  .refine(
    (data) => {
      if (data.availabilityMode === "scheduled" && data.opensAt && data.closesAt) {
        return data.closesAt > data.opensAt;
      }
      return true;
    },
    { message: "A data de encerramento deve ser posterior à de abertura.", path: ["closesAt"] }
  )
  .refine(
    (data) => {
      if (data.availabilityMode === "duration") {
        return data.durationHours != null && data.durationHours > 0;
      }
      return true;
    },
    { message: "Modo por duração exige a quantidade de horas.", path: ["durationHours"] }
  )
  .refine(
    (data) => {
      // Campos de seleção precisam ter opções definidas
      const selectTypes = new Set(["select", "multiselect", "radio"]);
      for (const field of data.fields) {
        if (selectTypes.has(field.type) && (!field.options || field.options.length === 0)) {
          return false;
        }
      }
      return true;
    },
    { message: "Campos de seleção precisam ter pelo menos uma opção.", path: ["fields"] }
  );

// ---------------------------------------------------------------------------
// Validação dinâmica de submissões
// ---------------------------------------------------------------------------

/**
 * Constrói um schema Zod para validar as respostas de um formulário com base
 * nos campos configurados. O servidor usa isto ANTES de gravar — nunca confia
 * no schema que o cliente possa ter enviado.
 *
 * Para campos `file`, valida apenas a presença da URL (o upload já aconteceu
 * em etapa anterior via Server Action dedicada).
 */
export function buildSubmissionSchema(fields: DynamicFormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case "text":
      case "textarea": {
        let s = z.string().trim();
        if (field.validation?.minLength) s = s.min(field.validation.minLength);
        if (field.validation?.maxLength) s = s.max(field.validation.maxLength);
        if (field.validation?.pattern) {
          s = s.regex(new RegExp(field.validation.pattern));
        }
        fieldSchema = field.required ? s.min(1, "Campo obrigatório.") : s.optional().or(z.literal(""));
        break;
      }
      case "email": {
        const s = z.string().trim().email("E-mail inválido.");
        fieldSchema = field.required ? s : s.optional().or(z.literal(""));
        break;
      }
      case "phone": {
        const phoneRegex = /^\+?[\d\s\-()]{8,20}$/;
        const s = z.string().trim().regex(phoneRegex, "Telefone inválido.");
        fieldSchema = field.required ? s : s.optional().or(z.literal(""));
        break;
      }
      case "number": {
        let s = z.coerce.number();
        if (field.validation?.min != null) s = s.min(field.validation.min);
        if (field.validation?.max != null) s = s.max(field.validation.max);
        fieldSchema = field.required ? s : s.optional().nullable();
        break;
      }
      case "date": {
        const s = z.coerce.date();
        fieldSchema = field.required ? s : s.optional().nullable();
        break;
      }
      case "select":
      case "radio": {
        const validIds = (field.options ?? []).map((o) => o.id);
        const s = z.string().refine((v) => validIds.includes(v), { message: "Opção inválida." });
        fieldSchema = field.required ? s : s.optional().or(z.literal(""));
        break;
      }
      case "multiselect": {
        const validIds = (field.options ?? []).map((o) => o.id);
        const s = z
          .array(z.string())
          .refine((arr) => arr.every((v) => validIds.includes(v)), { message: "Opção inválida." });
        fieldSchema = field.required ? s.min(1, "Selecione ao menos uma opção.") : s.optional();
        break;
      }
      case "boolean":
      case "consent": {
        let s = z.coerce.boolean();
        if (field.required && field.type === "consent") {
          s = s.refine((v) => v === true, { message: "Consentimento obrigatório." });
        }
        fieldSchema = s;
        break;
      }
      case "file": {
        // URL do arquivo já enviado via upload action
        const s = z.string().url("URL de arquivo inválida.");
        fieldSchema = field.required ? s : s.optional().or(z.literal(""));
        break;
      }
      default:
        fieldSchema = z.unknown();
    }

    shape[field.id] = fieldSchema;
  }

  return z.object(shape);
}

/**
 * Schema para a ação de upload de arquivo em formulário dinâmico.
 * Reutiliza a infraestrutura do Vercel Blob existente.
 */
export const formFileUploadSchema = z.object({
  formId: z.string().min(1),
  fieldId: z.string().min(1),
});