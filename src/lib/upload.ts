import "server-only";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import sharp from "sharp";

/**
 * Processamento de uploads do painel admin. Nunca confia em extensão de
 * arquivo ou Content-Type declarado pelo cliente: o tipo real é detectado a
 * partir dos bytes (sharp sniffing) e a imagem é sempre reprocessada (remove
 * EXIF/metadados e qualquer payload escondido no arquivo original). Nome
 * final é um UUID — nunca o nome enviado pelo usuário — o que também elimina
 * risco de path traversal.
 *
 * Arquivos vão para o Vercel Blob (armazenamento externo, não disco local do
 * app) — decisão obrigatória para rodar em host serverless como a Vercel:
 * funções serverless têm disco somente leitura (exceto `/tmp`, apagado entre
 * requisições), então qualquer arquivo gravado em `public/` durante a
 * execução simplesmente não sobrevive até a próxima requisição, faça ela
 * gravar em `public/uploads/`, `public/assets/` ou qualquer outra pasta — não
 * é uma questão de qual pasta, é o disco inteiro do projeto que é read-only
 * em produção lá.
 *
 * Exige a variável de ambiente `BLOB_READ_WRITE_TOKEN`:
 * - Na Vercel: gerada sozinha ao conectar um Blob Store ao projeto (Vercel
 *   Dashboard → Storage → Create Database → Blob), sem precisar copiar nada
 *   manualmente.
 * - Em desenvolvimento local: rode `vercel env pull .env.local` (com a
 *   Vercel CLI, projeto já linkado) para trazer o token pro seu `.env.local`,
 *   ou copie o valor manualmente do Dashboard.
 *
 * Se um dia o projeto migrar para um host com disco persistente (VPS,
 * Hostinger "Node.js App" etc.) e quiserem voltar a gravar em disco local, a
 * troca fica isolada aqui dentro — a assinatura de `saveImageUpload`/
 * `saveVideoUpload` foi mantida estável exatamente para isso, sem precisar
 * mexer nas Server Actions que as chamam.
 */

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_VIDEO_BYTES = 60 * 1024 * 1024; // 60MB
const ALLOWED_VIDEO_MIME = new Set(["video/mp4", "video/webm"]);

export interface UploadResult {
  url: string;
}

export class UploadValidationError extends Error {}

async function uploadToBlob(filename: string, buffer: Buffer, contentType: string): Promise<string> {
  try {
    // `addRandomSuffix: false` — o UUID no nome já garante que não repete;
    // deixar a lib acrescentar mais um sufixo só deixaria a URL mais longa
    // à toa.
    const blob = await put(filename, buffer, { access: "public", contentType, addRandomSuffix: false });
    return blob.url;
  } catch (err) {
    throw new Error(`Falha ao salvar arquivo no Vercel Blob: ${(err as Error).message}`);
  }
}

/**
 * Subdiretórios lógicos para organização dos uploads no Vercel Blob.
 * Estrutura: uploads/{categoria}/{uuid}.webp
 */
export type UploadCategory =
  | "eventos"
  | "avisos"
  | "ministerios"
  | "lideranca"
  | "galeria"
  | "celulas"
  | "hero"
  | "outros";

export interface SaveImageOptions {
  /** Subdiretório lógico dentro de `uploads/`. Padrão: "outros". */
  category?: UploadCategory;
}

export async function saveImageUpload(
  file: File,
  options?: SaveImageOptions
): Promise<UploadResult> {
  if (file.size === 0) throw new UploadValidationError("Arquivo vazio.");
  if (file.size > MAX_IMAGE_BYTES) {
    throw new UploadValidationError("Imagem maior que 8MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw new UploadValidationError("Arquivo não é uma imagem válida.");
  }

  const allowedFormats = new Set(["jpeg", "png", "webp"]);
  if (!metadata.format || !allowedFormats.has(metadata.format)) {
    throw new UploadValidationError("Formato de imagem não suportado (use JPG, PNG ou WebP).");
  }
  if (!metadata.width || !metadata.height || metadata.width < 200 || metadata.height < 200) {
    throw new UploadValidationError("Imagem muito pequena (mínimo 200x200px).");
  }

  const category = options?.category ?? "outros";
  const filename = `uploads/${category}/${randomUUID()}.webp`;

  // Reencoda sempre para WebP: descarta EXIF/GPS e qualquer payload anexado
  // ao arquivo original, além de reduzir peso (melhor Core Web Vitals).
  const output = await sharp(buffer)
    .rotate()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const url = await uploadToBlob(filename, output, "image/webp");
  return { url };
}

export async function saveVideoUpload(file: File): Promise<UploadResult> {
  if (file.size === 0) throw new UploadValidationError("Arquivo vazio.");
  if (file.size > MAX_VIDEO_BYTES) {
    throw new UploadValidationError("Vídeo maior que 60MB.");
  }
  if (!ALLOWED_VIDEO_MIME.has(file.type)) {
    throw new UploadValidationError("Formato de vídeo não suportado (use MP4 ou WebM).");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.type === "video/webm" ? "webm" : "mp4";
  const filename = `${randomUUID()}.${extension}`;

  const url = await uploadToBlob(filename, buffer, file.type);
  return { url };
}
