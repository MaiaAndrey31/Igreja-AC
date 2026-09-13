"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { siteSettingsDoc } from "@/lib/firebase/collections";
import { db } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/session";
import { siteSettingsSchema } from "@/lib/validation/schemas";
import { saveImageUpload, saveVideoUpload, UploadValidationError } from "@/lib/upload";
import { extractYoutubeId } from "@/lib/format";
import type { ActionState } from "@/actions/auth";

export async function updateSettingsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminSession();

  const ref = siteSettingsDoc();
  const currentSnap = await ref.get();
  const current = currentSnap.exists ? currentSnap.data() : undefined;

  let heroVideoUrl = current?.heroVideoUrl ?? "/videos/hero-placeholder.mp4";

  const videoFile = formData.get("heroVideoFile");
  if (videoFile instanceof File && videoFile.size > 0) {
    try {
      const result = await saveVideoUpload(videoFile);
      heroVideoUrl = result.url;
    } catch (err) {
      if (err instanceof UploadValidationError) return { error: err.message };
      // Erro inesperado (ex.: Vercel Blob sem token, indisponível) — loga
      // pro Vercel capturar nos logs da função e mostra a causa real pro
      // admin: só quem já está logado vê isso, então não há problema em
      // expor detalhe técnico aqui (ajuda a diagnosticar sem precisar
      // acessar os logs).
      console.error("Falha ao processar upload de vídeo do Hero:", err);
      return { error: `Falha ao processar o vídeo: ${(err as Error).message}` };
    }
  }

  // Link do YouTube pode vir como URL inteira (watch?v=, youtu.be/, /embed/,
  // /shorts/) ou já o ID puro — `extractYoutubeId` aceita os dois formatos.
  // Campo em branco mantém o ID já salvo (não obriga a igreja a colar de novo
  // toda vez que só muda outro campo do formulário).
  let heroYoutubeId = current?.heroYoutubeId ?? "";
  const heroYoutubeInput = formData.get("heroYoutubeUrl");
  if (typeof heroYoutubeInput === "string" && heroYoutubeInput.trim()) {
    const extracted = extractYoutubeId(heroYoutubeInput);
    if (!extracted) return { error: "Link do YouTube inválido. Cole a URL completa do vídeo ou o ID." };
    heroYoutubeId = extracted;
  }

  const parsed = siteSettingsSchema.safeParse({
    // `?? undefined`: um campo ausente do FormData vira `null`, não
    // `undefined` — e o `.default()` do Zod só substitui `undefined`. Sem
    // isso, um `<input type="hidden">` que não chegou a ser enviado (ex.:
    // ficou fora do ramo condicional certo em algum ponto do formulário)
    // reprova a validação inteira em vez de cair no padrão.
    heroMediaType: formData.get("heroMediaType") ?? undefined,
    heroVideoSource: formData.get("heroVideoSource") ?? undefined,
    heroFocusY: formData.get("heroFocusY"),
    heroVideoUrl,
    heroYoutubeId,
    heroTitle: formData.get("heroTitle"),
    heroSubtitle: formData.get("heroSubtitle"),
    donationText: formData.get("donationText"),
    pixKeyType: formData.get("pixKeyType"),
    pixKey: formData.get("pixKey"),
    bankName: formData.get("bankName"),
    bankAgency: formData.get("bankAgency"),
    bankAccount: formData.get("bankAccount"),
    bankHolder: formData.get("bankHolder"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  // `merge: true`: as fotos do carrossel (`heroPosterUrls`) vivem fora deste
  // formulário — são gerenciadas por `addHeroPhotoAction`/
  // `removeHeroPhotoAction` — um `.set()` sem merge substituiria o documento
  // inteiro e apagaria a lista.
  await ref.set({ ...parsed.data, updatedAt: new Date() }, { merge: true });

  revalidatePath("/");
  revalidatePath("/contribua");
  revalidatePath("/admin/configuracoes");
  return { success: true };
}

const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC_ID = "site";

export async function addHeroPhotoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdminSession();

  const file = formData.get("heroPhotoFile");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione uma imagem." };
  }

  let url: string;
  try {
    const result = await saveImageUpload(file);
    url = result.url;
  } catch (err) {
    if (err instanceof UploadValidationError) return { error: err.message };
    // Erro inesperado (ex.: Vercel Blob sem token, indisponível) — loga pro
    // Vercel capturar nos logs da função e mostra a causa real pro admin: só
    // quem já está logado vê isso, então não há problema em expor detalhe
    // técnico aqui (ajuda a diagnosticar sem precisar acessar os logs).
    console.error("Falha ao processar upload de foto do Hero:", err);
    return { error: `Falha ao processar a imagem: ${(err as Error).message}` };
  }

  // `arrayUnion`/raw doc (sem o conversor): evita ler-modificar-escrever e
  // funciona mesmo se o documento ainda não existir.
  await db()
    .collection(SETTINGS_COLLECTION)
    .doc(SETTINGS_DOC_ID)
    .set({ heroPosterUrls: FieldValue.arrayUnion(url), updatedAt: new Date() }, { merge: true });

  revalidatePath("/");
  revalidatePath("/admin/configuracoes");
  return { success: true };
}

export async function removeHeroPhotoAction(url: string): Promise<void> {
  await requireAdminSession();

  await db()
    .collection(SETTINGS_COLLECTION)
    .doc(SETTINGS_DOC_ID)
    .update({ heroPosterUrls: FieldValue.arrayRemove(url), updatedAt: new Date() });

  revalidatePath("/");
  revalidatePath("/admin/configuracoes");
}
