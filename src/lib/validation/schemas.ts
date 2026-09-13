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
  order: z.coerce.number().int().min(0).default(0),
});

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
  heroFocusY: z.coerce.number().int().min(0).max(100).default(35),
  heroVideoUrl: z.string().trim().min(1).max(500),
  heroPosterUrl: z.string().trim().min(1).max(500),
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
