"use client";

import { useActionState, useEffect, useState } from "react";
import { updateSettingsAction } from "@/actions/settings";
import type { ActionState } from "@/actions/auth";
import { FieldGroup, Input, Textarea, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/lib/firebase/collections";

const emptyState: ActionState = {};

type HeroMediaType = "video" | "image";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction] = useActionState(updateSettingsAction, emptyState);
  const { push } = useToast();
  const [mediaType, setMediaType] = useState<HeroMediaType>((settings.heroMediaType as HeroMediaType) ?? "video");
  const [focusY, setFocusY] = useState(settings.heroFocusY ?? 35);

  useEffect(() => {
    if (state.success) push("Configurações salvas.");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

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

          {mediaType === "video" ? (
            <FieldGroup label="Vídeo de fundo (opcional)" htmlFor="heroVideoFile" hint="MP4 ou WebM, até 60MB. Mantém o atual se vazio.">
              <Input id="heroVideoFile" name="heroVideoFile" type="file" accept="video/mp4,video/webm" />
            </FieldGroup>
          ) : (
            <FieldGroup
              label="Foto de fundo (opcional)"
              htmlFor="heroPosterFile"
              hint="JPG, PNG ou WebP, até 8MB. Mantém a atual se vazia. Prefira fotos bem largas (panorâmicas) — cortam menos."
            >
              <Input id="heroPosterFile" name="heroPosterFile" type="file" accept="image/jpeg,image/png,image/webp" />
            </FieldGroup>
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
            <FieldGroup label="Chave Pix" htmlFor="pixKey">
              <Input id="pixKey" name="pixKey" defaultValue={settings.pixKey} required />
            </FieldGroup>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FieldGroup label="Banco" htmlFor="bankName">
              <Input id="bankName" name="bankName" defaultValue={settings.bankName} required />
            </FieldGroup>
            <FieldGroup label="Agência" htmlFor="bankAgency">
              <Input id="bankAgency" name="bankAgency" defaultValue={settings.bankAgency} required />
            </FieldGroup>
            <FieldGroup label="Conta" htmlFor="bankAccount">
              <Input id="bankAccount" name="bankAccount" defaultValue={settings.bankAccount} required />
            </FieldGroup>
          </div>

          <FieldGroup label="Titular da conta" htmlFor="bankHolder">
            <Input id="bankHolder" name="bankHolder" defaultValue={settings.bankHolder} required />
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
