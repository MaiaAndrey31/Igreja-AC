"use server";

import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { formsCollection } from "@/lib/firebase/collections";
import { computeEffectiveStatus } from "@/lib/forms/availability";
import type { ActionState } from "@/actions/auth";

/**
 * Upload público de arquivo para formulário dinâmico.
 *
 * Diferente dos uploads administrativos, esta action NÃO exige sessão admin —
 * é chamada por visitantes no formulário público. A segurança está em:
 * 1. Validação de que o formulário existe, está publicado e aceitando respostas.
 * 2. Validação rigorosa de tipo MIME (por bytes, não por extensão).
 * 3. Limite de tamanho configurável por campo.
 * 4. Arquivos vão para pasta isolada no Vercel Blob (`form-uploads/`).
 * 5. Rate limit por IP já aplicado na action de submissão.
 *
 * Retorna a URL pública do arquivo para ser incluída na submissão.
 * O arquivo só é "associado" à submissão quando ela é gravada com sucesso.
 * Arquivos órfãos (upload sem submissão posterior) são toleráveis: são
 * arquivos públicos de formulário, sem dado sensível, e o custo de cleanup
 * automático supera o benefício para este caso de uso.
 */

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB padrão
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function uploadFormFileAction(
  slug: string,
  fieldId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState & { url?: string }> {
  // 1. Validar formulário
  const formSnap = await formsCollection()
    .where("slug", "==", slug)
    .where("adminStatus", "==", "published")
    .limit(1)
    .get();

  if (formSnap.empty) return { error: "Formulário não encontrado." };
  const form = formSnap.docs[0].data();

  const effectiveStatus = computeEffectiveStatus({
    adminStatus: form.adminStatus,
    availability: form.availability,
    submissionCount: form.submissionCount,
    maxSubmissions: form.maxSubmissions,
  });

  if (effectiveStatus !== "open") {
    return { error: "Formulário não aceita mais inscrições." };
  }

  // 2. Validar campo existe e é do tipo file
  const fields = form.publishedFieldsSnapshot ?? form.fields;
  const field = fields.find((f) => f.id === fieldId);
  if (!field || field.type !== "file") {
    return { error: "Campo de arquivo inválido." };
  }

  // 3. Extrair e validar arquivo
  const file = formData.get(fieldId);
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Nenhum arquivo enviado." };
  }

  const maxSize = field.validation?.maxFileSizeBytes ?? MAX_FILE_BYTES;
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return { error: `Arquivo maior que ${maxMB}MB.` };
  }

  // 4. Validar MIME type real (não confiar em file.type do navegador)
  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedMime = detectMimeType(buffer);

  if (!detectedMime || !ALLOWED_MIME_TYPES.has(detectedMime)) {
    return {
      error:
        "Tipo de arquivo não permitido. Use JPG, PNG, WebP ou PDF.",
    };
  }

  // Se o campo tem allowedMimeTypes configurado, respeitar
  if (
    field.validation?.allowedMimeTypes &&
    field.validation.allowedMimeTypes.length > 0 &&
    !field.validation.allowedMimeTypes.includes(detectedMime)
  ) {
    return { error: "Tipo de arquivo não permitido para este campo." };
  }

  // 5. Upload para Vercel Blob em pasta isolada
  const ext = mimeToExtension(detectedMime);
  const filename = `form-uploads/${randomUUID()}.${ext}`;

  try {
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: detectedMime,
      addRandomSuffix: false,
    });
    return { success: true, url: blob.url };
  } catch (err) {
    console.error("Falha ao salvar arquivo de formulário:", err);
    return { error: "Falha ao enviar o arquivo. Tente novamente." };
  }
}

/**
 * Detecção de MIME type por magic bytes — nunca confia na extensão ou no
 * Content-Type declarado pelo navegador. Cobre os formatos permitidos.
 */
function detectMimeType(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.length > 11 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  // PDF: 25 50 44 46
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "application/pdf";
  }
  // DOCX/XLSX/PPTX (ZIP): 50 4B 03 04
  if (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    // Não dá pra distinguir DOCX de XLSX só pelos magic bytes;
    // aceitamos como Word genérico — a validação por extensão do campo
    // pode refinar se necessário.
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  // OLE2 (DOC antigo): D0 CF 11 E0
  if (
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0
  ) {
    return "application/msword";
  }

  return null;
}

function mimeToExtension(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "application/pdf":
      return "pdf";
    case "application/msword":
      return "doc";
    default:
      return "bin";
  }
}