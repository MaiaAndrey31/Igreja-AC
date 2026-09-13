import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Processamento de uploads do painel admin. Nunca confia em extensão de
 * arquivo ou Content-Type declarado pelo cliente: o tipo real é detectado a
 * partir dos bytes (sharp sniffing) e a imagem é sempre reprocessada (remove
 * EXIF/metadados e qualquer payload escondido no arquivo original). Nome
 * final é um UUID — nunca o nome enviado pelo usuário — o que também elimina
 * risco de path traversal.
 *
 * Arquivos vão para `public/uploads/`, servidos pelo próprio Next.js como
 * arquivo estático (`/uploads/<arquivo>`).
 *
 * ATENÇÃO — isso só é seguro em host com disco PERSISTENTE (VPS, "Node.js
 * App" da Hostinger etc., que é o que o README deste projeto assume). Em
 * hospedagem serverless/containers efêmeros (Vercel, Cloud Run sem volume,
 * etc.) o diretório do app é recriado a cada deploy e todo arquivo gravado
 * aqui em runtime se perde no deploy seguinte. Se um dia migrarem para esse
 * tipo de host, troquem esta implementação por um object storage externo
 * (Supabase Storage, Firebase Storage, S3...) — a assinatura das duas funções
 * abaixo (`saveImageUpload`/`saveVideoUpload`) foi mantida estável
 * exatamente para isolar essa troca aqui dentro, sem mexer nas Server
 * Actions que as chamam.
 */

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_VIDEO_BYTES = 60 * 1024 * 1024; // 60MB
const ALLOWED_VIDEO_MIME = new Set(["video/mp4", "video/webm"]);

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export interface UploadResult {
  url: string;
}

export class UploadValidationError extends Error {}

async function writeToDisk(filename: string, buffer: Buffer): Promise<string> {
  try {
    await mkdir(UPLOADS_DIR, { recursive: true });
    await writeFile(path.join(UPLOADS_DIR, filename), buffer);
  } catch (err) {
    throw new Error(`Falha ao salvar arquivo em disco: ${(err as Error).message}`);
  }
  return `/uploads/${filename}`;
}

export async function saveImageUpload(file: File): Promise<UploadResult> {
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

  const filename = `${randomUUID()}.webp`;

  // Reencoda sempre para WebP: descarta EXIF/GPS e qualquer payload anexado
  // ao arquivo original, além de reduzir peso (melhor Core Web Vitals).
  const output = await sharp(buffer)
    .rotate()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const url = await writeToDisk(filename, output);
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

  const url = await writeToDisk(filename, buffer);
  return { url };
}
