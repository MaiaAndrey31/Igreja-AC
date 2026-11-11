/**
 * Tipos compartilhados do módulo de formulários dinâmicos.
 *
 * Este arquivo NÃO importa `server-only` nem Firebase — é seguro importar em
 * componentes client e server. Os conversores e funções de acesso ao Firestore
 * vivem em `src/lib/firebase/collections.ts` (server-only).
 */

// ---------------------------------------------------------------------------
// Campos do formulário
// ---------------------------------------------------------------------------

export type DynamicFormFieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "select"
  | "multiselect"
  | "radio"
  | "boolean"
  | "consent"
  | "file";

export interface SelectOption {
  id: string;
  label: string;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  /** Apenas para campo `file`: MIME types permitidos (ex.: ["image/jpeg", "application/pdf"]). */
  allowedMimeTypes?: string[];
  /** Apenas para campo `file`: tamanho máximo em bytes. */
  maxFileSizeBytes?: number;
}

export interface DynamicFormField {
  /** ID estável gerado no momento da criação do campo. Nunca muda, mesmo que o label seja editado. */
  id: string;
  type: DynamicFormFieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: SelectOption[];
  validation?: FieldValidation;
  /** Ordem de exibição. Reordenar campos altera apenas este valor. */
  order: number;
}

// ---------------------------------------------------------------------------
// Disponibilidade
// ---------------------------------------------------------------------------

export type AvailabilityMode = "manual" | "scheduled" | "duration";

export interface AvailabilityConfig {
  mode: AvailabilityMode;
  /** Modo `scheduled`: data/hora de abertura (ISO string ou Timestamp convertido). */
  opensAt?: Date | null;
  /** Modo `scheduled`: data/hora de encerramento. */
  closesAt?: Date | null;
  /** Modo `duration`: duração em horas após ativação manual. */
  durationHours?: number | null;
  /**
   * Momento em que o admin ativou manualmente o formulário (modos `manual` e
   * `duration`). Nulo quando ainda não foi ativado ou quando está em modo
   * `scheduled` puro (abertura automática por data).
   */
  activatedAt?: Date | null;
}

// ---------------------------------------------------------------------------
// Status administrativo vs. disponibilidade efetiva
// ---------------------------------------------------------------------------

/** Status controlado pelo admin, independente de datas ou limites. */
export type FormAdminStatus = "draft" | "published" | "archived";

/** Disponibilidade calculada no servidor, derivada do status + configuração. */
export type FormEffectiveStatus =
  | "draft"
  | "not_yet_open"
  | "open"
  | "closed_by_schedule"
  | "closed_by_duration"
  | "closed_manually"
  | "full"
  | "archived";

// ---------------------------------------------------------------------------
// Formulário dinâmico
// ---------------------------------------------------------------------------

export type FormPurpose =
  | "evento"
  | "cadastro"
  | "pesquisa"
  | "inscricao"
  | "solicitacao"
  | "outros";

export interface DynamicForm {
  id: string;
  title: string;
  description: string;
  slug: string;
  purpose: FormPurpose;
  fields: DynamicFormField[];
  schemaVersion: number;
  /** Snapshot imutável dos campos na versão publicada. Respostas referenciam esta versão. */
  publishedFieldsSnapshot: DynamicFormField[] | null;
  availability: AvailabilityConfig;
  adminStatus: FormAdminStatus;
  maxSubmissions: number | null;
  submissionCount: number;
  showRemainingSlots: boolean;
  /** URL opcional de um evento associado (futuro). */
  eventRef: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type DynamicFormInput = Omit<DynamicForm, "id" | "createdAt" | "updatedAt">;

// ---------------------------------------------------------------------------
// Submissão
// ---------------------------------------------------------------------------

export type SubmissionStatus = "confirmed" | "cancelled";

export interface DynamicFormSubmission {
  id: string;
  formId: string;
  schemaVersion: number;
  answers: Record<string, unknown>;
  /** URLs de arquivos enviados, indexados pelo fieldId. */
  files: Record<string, string>;
  status: SubmissionStatus;
  createdAt: Date;
}

export type DynamicFormSubmissionInput = Omit<
  DynamicFormSubmission,
  "id" | "createdAt"
>;

// ---------------------------------------------------------------------------
// Rate limit por formulário
// ---------------------------------------------------------------------------

export interface FormRateLimitEntry {
  count: number;
  windowStartsAt: Date;
}