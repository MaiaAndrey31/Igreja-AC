import { z } from "zod";
import { passwordPolicySchema } from "@/lib/auth/password";

/**
 * Schemas Zod compartilhados por Server Actions (mutação) e formulários do
 * painel admin (parse antes de enviar). O server nunca confia no client —
 * cada Server Action roda o parse novamente contra o FormData recebido.
 */

/** Aceita string vazia (campo ainda não preenchido) ou o schema informado. */
function emptyOr<T extends z.ZodType<string>>(schema: T) {
  return z.union([z.literal(""), schema]);
}

export const ministrySchema = z.object({
  title: z.string().trim().min(2, "Informe um título.").max(80),
  description: z.string().trim().min(10, "Descreva o ministério.").max(600),
  icon: z.string().trim().min(1).max(40),
  highlight: z.coerce.boolean().default(false),
  order: z.coerce.number().int().min(0).default(0),
  published: z.coerce.boolean().default(true),
});

const whatsappRegex = /^\d{10,14}$/;

export const cellSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome para a célula.").max(80),
  leaderName: z.string().trim().min(2, "Informe o nome do líder.").max(80),
  neighborhood: z.string().trim().min(2, "Informe o bairro/região.").max(80),
  address: z.string().trim().min(4, "Informe o endereço.").max(200),
  dayTime: z.string().trim().min(2, "Informe dia e horário.").max(80),
  whatsapp: z
    .string()
    .trim()
    .regex(whatsappRegex, "Use o formato DDI+DDD+número, só dígitos (ex.: 5547999999999)."),
  logoUrl: z.string().trim().max(500).optional().or(z.literal("")),
  active: z.coerce.boolean().default(true),
  published: z.coerce.boolean().default(false),
  order: z.coerce.number().int().min(0).default(0),
  // Novos campos do localizador de células
  region: z.enum(["vermelha", "verde", "amarela", "azul", "laranja"]).nullable().default(null),
  profile: z.string().trim().max(100).nullable().default(null),
  city: z.string().trim().max(80).nullable().default(null),
  citySlug: z.string().trim().max(80).nullable().default(null),
  sedeId: z.string().trim().max(100).nullable().default(null),
  meetingDay: z.string().trim().max(40).nullable().default(null),
  meetingTime: z.string().trim().max(20).nullable().default(null),
  latitude: z.coerce.number().min(-90).max(90).nullable().default(null),
  longitude: z.coerce.number().min(-180).max(180).nullable().default(null),
  geocodeStatus: z.enum(["verified", "pending", "failed", "manual"]).default("pending"),
  reviewStatus: z.enum(["ok", "needs_review"]).default("ok"),
  addressPublic: z.coerce.boolean().default(false),
  locationPublic: z.coerce.boolean().default(false),
  sourceId: z.string().trim().max(20).nullable().default(null),
});

// Regex para links de grupo WhatsApp ou Telegram
const groupUrlRegex =
  /^https:\/\/(chat\.whatsapp\.com\/[A-Za-z0-9_-]+|t\.me\/[A-Za-z0-9_]+)$/;

export const announcementSchema = z
  .object({
    title: z.string().trim().min(2, "Informe um título.").max(100),
    description: z.string().trim().min(10, "Descreva o aviso.").max(800),
    imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
    instagramUrl: z
      .string()
      .trim()
      .max(500)
      .optional()
      .or(z.literal(""))
      .refine((value) => !value || /^https:\/\/(www\.)?(instagram\.com|instagr\.am)\//.test(value), {
        message: "Cole um link válido do Instagram (instagram.com).",
      }),
    category: z.enum(["Aviso", "Culto especial", "Conferência"]).default("Aviso"),
    startDate: z.coerce.date({ message: "Informe a data de início." }),
    endDate: z.coerce.date().optional(),
    published: z.coerce.boolean().default(true),
    // Novos campos do módulo de eventos
    visualId: z.string().trim().max(60).optional().or(z.literal("")).nullable(),
    groupUrl: z
      .string()
      .trim()
      .max(500)
      .optional()
      .or(z.literal(""))
      .nullable()
      .refine((value) => !value || groupUrlRegex.test(value), {
        message: "Use um link válido de grupo WhatsApp (chat.whatsapp.com/...) ou Telegram (t.me/...).",
      }),
    confirmationMessage: z.string().trim().max(1000).optional().or(z.literal("")).nullable(),
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: "A data final não pode ser anterior à data de início.",
    path: ["endDate"],
  });

export const galleryImageSchema = z.object({
  url: z.string().trim().min(1, "Envie uma imagem.").max(500),
  alt: z.string().trim().min(3, "Descreva a imagem (texto alternativo).").max(160),
  eventName: z.string().trim().max(120).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
});

export const siteSettingsSchema = z.object({
  heroMediaType: z.enum(["video", "image"]).default("video"),
  heroVideoSource: z.enum(["upload", "youtube"]).default("upload"),
  heroFocusY: z.coerce.number().int().min(0).max(100).default(35),
  heroVideoUrl: z.string().trim().min(1).max(500),
  heroYoutubeId: z.string().trim().max(20),
  heroTitle: z.string().trim().min(4).max(140),
  heroSubtitle: z.string().trim().min(4).max(200),
  donationText: z.string().trim().min(10).max(800),
  pixKeyType: z.enum(["CPF", "CNPJ", "E-mail", "Telefone", "Aleatória"]),
  // Campos de contribuição podem ficar vazios: enquanto a igreja não tem os
  // dados oficiais, /contribua mostra `[CONTEÚDO PENDENTE]`. Exigir valor aqui
  // travaria o salvamento de qualquer outra configuração (hero, mídia) só
  // porque o Pix ainda não chegou. Preenchido, continua validado pelo tamanho.
  pixKey: emptyOr(z.string().trim().min(4).max(120)),
  bankName: emptyOr(z.string().trim().min(2).max(80)),
  bankAgency: emptyOr(z.string().trim().min(1).max(20)),
  bankAccount: emptyOr(z.string().trim().min(1).max(30)),
  bankHolder: emptyOr(z.string().trim().min(2).max(120)),
});

export const leaderSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(80),
  role: z.string().trim().min(2, "Informe a função.").max(100),
  quote: z.string().trim().max(300).optional().or(z.literal("")),
  photoUrl: z.string().trim().max(500).optional().or(z.literal("")),
  active: z.coerce.boolean().default(true),
  order: z.coerce.number().int().min(0).default(0),
});

export const messageSchema = z.object({
  title: z.string().trim().min(2, "Informe um título.").max(140),
  speaker: z.string().trim().min(2, "Informe quem pregou.").max(80),
  date: z.coerce.date({ message: "Informe a data." }),
  youtubeId: z
    .string()
    .trim()
    .min(1, "Informe o ID do vídeo no YouTube (o que vem depois de ?v=).")
    .max(20),
  published: z.coerce.boolean().default(true),
  order: z.coerce.number().int().min(0).default(0),
});

export const socialLinkSchema = z.object({
  platform: z.enum(["instagram", "facebook", "whatsapp", "email", "youtube", "other"]),
  label: z.string().trim().min(2, "Informe um rótulo.").max(40),
  handle: z.string().trim().min(1, "Informe como o canal é divulgado.").max(80),
  href: z.string().trim().min(1, "Informe o link.").max(500),
  external: z.coerce.boolean().default(true),
  order: z.coerce.number().int().min(0).default(0),
});

export const serviceSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  time: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use o formato HH:MM (ex.: 20:00)."),
  label: z.string().trim().max(60).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
});

export const unitInfoSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da igreja.").max(120),
  shortName: z.string().trim().min(2).max(80),
  initials: z.string().trim().min(1).max(6),
  tagline: z.string().trim().min(2).max(160),
  verseReference: z.string().trim().min(2).max(60),
  verseExcerpt: z.string().trim().min(2).max(160),
  verseReading: z.string().trim().min(2).max(300),
  modelTitle: z.string().trim().min(2).max(120),
  modelDescription: z.string().trim().min(2).max(200),
  isFirstExtension: z.coerce.boolean().default(false),
  foundedYear: z.coerce.number().int().min(1900).max(2100),
  foundedDateLabel: z.string().trim().min(2).max(60),
  foundingMembers: z.coerce.number().int().min(0),
  originStory: z.string().trim().min(10).max(1200),
  newTempleYear: z.coerce.number().int().min(1900).max(2100),
  newTempleStory: z.string().trim().min(10).max(1200),
  address: z.string().trim().min(4).max(200),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().length(2, "Use a sigla do estado (ex.: SP)."),
  contactEmail: z.string().trim().email("Informe um e-mail válido."),
  contactPhoneDisplay: z.string().trim().min(4).max(40),
  contactPhoneE164: z
    .string()
    .trim()
    .regex(/^\d{10,14}$/, "Use o formato DDI+DDD+número, só dígitos (ex.: 5518988887777)."),
  cellsCountLabel: z.string().trim().min(1).max(20),
  networkName: z.string().trim().min(2).max(80),
  networkSite: z.string().trim().url("Informe uma URL válida.").max(200),
  networkHeadquartersCity: z.string().trim().min(2).max(80),
  networkHeadquartersState: z.string().trim().length(2, "Use a sigla do estado (ex.: SP)."),
  networkFoundedYear: z.coerce.number().int().min(1500).max(2100),
});

/**
 * Formulário público (célula/decisão/testemunho/oração) — sem sessão admin,
 * então validado com o mesmo rigor de qualquer entrada não confiável.
 * `honeypot` precisa chegar vazio: só um bot preenche um campo escondido.
 */
export const formSubmissionSchema = z.object({
  type: z.enum(["celula", "decisao", "testemunho", "oracao"]),
  name: z.string().trim().min(2, "Informe seu nome.").max(80),
  contact: z.string().trim().min(8, "Informe um telefone ou e-mail para contato.").max(120),
  message: z.string().trim().max(600).optional().or(z.literal("")),
  honeypot: z.string().max(0, "Falha na validação.").optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    newPassword: passwordPolicySchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "A confirmação não coincide com a nova senha.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "A nova senha precisa ser diferente da senha atual.",
    path: ["newPassword"],
  });
