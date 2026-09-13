"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { updateSettingsAction } from "@/actions/settings";
import type { ActionState } from "@/actions/auth";
import { FieldGroup, Input, Textarea, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { HeroPhotoManager } from "@/components/admin/settings/HeroPhotoManager";
import { cn } from "@/lib/utils";
import { hasRealMedia } from "@/lib/heroCopy";
import { extractYoutubeId, youtubeThumbnail } from "@/lib/format";
import type { SiteSettings } from "@/lib/firebase/collections";

const emptyState: ActionState = {};

type HeroMediaType = "video" | "image";
type HeroVideoSource = "upload" | "youtube";

/** Objeto local (ainda não enviado) — sempre tem prioridade sobre o que já está salvo. */
function useObjectUrlPreview(file: File | null): string | null {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  // Só libera memória (sem setState) quando a URL muda ou o componente
  // desmonta — criar a URL fica no useMemo acima, não aqui, porque o valor
  // é usado direto na renderização (não sincroniza um sistema externo com
  // React, é o próprio dado que a UI precisa desenhar).
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return url;
}

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction] = useActionState(updateSettingsAction, emptyState);
  const { push } = useToast();
  const [mediaType, setMediaType] = useState<HeroMediaType>((settings.heroMediaType as HeroMediaType) ?? "video");
  const [videoSource, setVideoSource] = useState<HeroVideoSource>(
    (settings.heroVideoSource as HeroVideoSource) ?? "upload"
  );
  const [focusY, setFocusY] = useState(settings.heroFocusY ?? 35);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState(settings.heroYoutubeId);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const videoFilePreview = useObjectUrlPreview(videoFile);

  useEffect(() => {
    if (state.success) push("Configurações salvas.");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  // O que mostrar na pré-visualização de foco, dependendo do modo atual —
  // sempre prioriza um arquivo recém-escolhido (ainda não salvo) sobre o que
  // já está no Firestore, e nunca mostra os placeholders de "nada enviado
  // ainda" (ver hasRealMedia).
  let previewKind: "image" | "video" | null = null;
  let previewSrc: string | null = null;

  if (mediaType === "image") {
    previewKind = "image";
    previewSrc = settings.heroPosterUrls[0] ?? null;
  } else if (videoSource === "upload") {
    previewKind = "video";
    previewSrc = videoFilePreview ?? (hasRealMedia(settings.heroVideoUrl) ? settings.heroVideoUrl : null);
  } else {
    const youtubeId = youtubeUrlInput.trim() ? extractYoutubeId(youtubeUrlInput) : null;
    if (youtubeId) {
      previewKind = "image";
      previewSrc = youtubeThumbnail(youtubeId);
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-10">
      <section>
        <h2 className="font-display text-lg tracking-wide text-foreground">Hero da página inicial</h2>
        <div className="mt-5 flex flex-col gap-4">
          <FieldGroup label="Título" htmlFor="heroTitle">
            <Input id="heroTitle" name="heroTitle" defaultValue={settings.heroTitle} required />
          </FieldGroup>
          <FieldGroup label="Subtítulo" htmlFor="heroSubtitle">
            <Textarea id="heroSubtitle" name="heroSubtitle" defaultValue={settings.heroSubtitle} required />
          </FieldGroup>

          <FieldGroup label="Fundo do Hero" hint="Só um dos dois aparece no site — o vídeo ou a foto, nunca os dois.">
            <div className="inline-flex w-fit rounded-lg border border-border-subtle bg-surface p-1">
              {(["video", "image"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMediaType(option)}
                  className={cn(
                    "rounded-md px-4 py-1.5 text-sm transition-colors",
                    mediaType === option ? "bg-foreground text-background" : "text-foreground-muted hover:text-foreground"
                  )}
                >
                  {option === "video" ? "Vídeo" : "Foto"}
                </button>
              ))}
            </div>
            <input type="hidden" name="heroMediaType" value={mediaType} />
          </FieldGroup>

          {/* Sempre no DOM, independente da aba selecionada — se ficasse só
              dentro do bloco "Vídeo", escolher "Foto" deixaria de enviar este
              campo, e a validação do servidor falha em `null` (o `.default()`
              do Zod só cobre `undefined`, não a ausência de um campo de
              FormData). O valor só importa de fato quando `heroMediaType` é
              "video", mas precisa estar sempre presente no submit. */}
          <input type="hidden" name="heroVideoSource" value={videoSource} />

          {mediaType === "video" ? (
            <>
              <FieldGroup label="Origem do vídeo">
                <div className="inline-flex w-fit rounded-lg border border-border-subtle bg-surface p-1">
                  {(["upload", "youtube"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setVideoSource(option)}
                      className={cn(
                        "rounded-md px-4 py-1.5 text-sm transition-colors",
                        videoSource === option
                          ? "bg-foreground text-background"
                          : "text-foreground-muted hover:text-foreground"
                      )}
                    >
                      {option === "upload" ? "Enviar arquivo" : "Link do YouTube"}
                    </button>
                  ))}
                </div>
              </FieldGroup>

              {videoSource === "upload" ? (
                <FieldGroup
                  label="Vídeo de fundo (opcional)"
                  htmlFor="heroVideoFile"
                  hint="MP4 ou WebM, até 60MB. Mantém o atual se vazio."
                >
                  <Input
                    id="heroVideoFile"
                    name="heroVideoFile"
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                  />
                </FieldGroup>
              ) : (
                <FieldGroup
                  label="Link do vídeo no YouTube"
                  htmlFor="heroYoutubeUrl"
                  hint="Cole a URL do vídeo (ou só o ID). Deixe em branco para manter o vídeo já salvo. O vídeo toca em loop, mudo, sem controles."
                >
                  <Input
                    id="heroYoutubeUrl"
                    name="heroYoutubeUrl"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrlInput}
                    onChange={(e) => setYoutubeUrlInput(e.target.value)}
                  />
                </FieldGroup>
              )}
            </>
          ) : (
            <HeroPhotoManager photoUrls={settings.heroPosterUrls} />
          )}

          <FieldGroup
            label="Foco da imagem"
            htmlFor="heroFocusY"
            hint="A área do Hero corta as bordas para preencher a tela — escolha qual parte é mais importante manter visível."
          >
            <Select id="heroFocusY" name="heroFocusY" value={focusY} onChange={(e) => setFocusY(Number(e.target.value))}>
              <option value={10}>Topo</option>
              <option value={35}>Centro-alto</option>
              <option value={50}>Centro</option>
              <option value={65}>Centro-baixo</option>
              <option value={90}>Base</option>
            </Select>
          </FieldGroup>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">Pré-visualização</p>
            <div className="relative mt-2 aspect-[21/9] w-full max-w-md overflow-hidden rounded-lg border border-border-subtle bg-surface-2">
              {previewSrc ? (
                previewKind === "video" ? (
                  <video
                    key={previewSrc}
                    src={previewSrc}
                    muted
                    autoPlay
                    loop
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ objectPosition: `50% ${focusY}%` }}
                  />
                ) : (
                  // Preview de arquivo local (blob:) ou thumbnail do YouTube — não
                  // passa pelo otimizador do `next/image`, então <img> mesmo.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewSrc}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ objectPosition: `50% ${focusY}%` }}
                  />
                )
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-xs text-foreground-subtle">
                  Nenhuma mídia para pré-visualizar ainda — envie um arquivo ou cole um link do YouTube.
                </div>
              )}
            </div>
            <p className="mt-2 max-w-md text-xs text-foreground-subtle">
              É aproximadamente isso que aparece no Hero — a área acima/abaixo do quadro é cortada para
              preencher a tela do visitante.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border-subtle pt-8">
        <h2 className="font-display text-lg tracking-wide text-foreground">Contribuição</h2>
        <div className="mt-5 flex flex-col gap-4">
          <FieldGroup label="Texto de transparência" htmlFor="donationText">
            <Textarea id="donationText" name="donationText" defaultValue={settings.donationText} required />
          </FieldGroup>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Tipo de chave Pix" htmlFor="pixKeyType">
              <Select id="pixKeyType" name="pixKeyType" defaultValue={settings.pixKeyType}>
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
                <option value="E-mail">E-mail</option>
                <option value="Telefone">Telefone</option>
                <option value="Aleatória">Aleatória</option>
              </Select>
            </FieldGroup>
            <FieldGroup label="Chave Pix" htmlFor="pixKey" hint="Opcional — enquanto vazio, /contribua mostra que o Pix ainda não foi cadastrado.">
              <Input id="pixKey" name="pixKey" defaultValue={settings.pixKey} />
            </FieldGroup>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FieldGroup label="Banco (opcional)" htmlFor="bankName">
              <Input id="bankName" name="bankName" defaultValue={settings.bankName} />
            </FieldGroup>
            <FieldGroup label="Agência (opcional)" htmlFor="bankAgency">
              <Input id="bankAgency" name="bankAgency" defaultValue={settings.bankAgency} />
            </FieldGroup>
            <FieldGroup label="Conta (opcional)" htmlFor="bankAccount">
              <Input id="bankAccount" name="bankAccount" defaultValue={settings.bankAccount} />
            </FieldGroup>
          </div>

          <FieldGroup label="Titular da conta (opcional)" htmlFor="bankHolder">
            <Input id="bankHolder" name="bankHolder" defaultValue={settings.bankHolder} />
          </FieldGroup>
        </div>
      </section>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <SubmitButton pendingLabel="Salvando..." className="self-start">
        Salvar configurações
      </SubmitButton>
    </form>
  );
}
