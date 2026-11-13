"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "lucide-react";
import type { PopupAnnouncement } from "@/lib/data";

// ---------------------------------------------------------------------------
// Storage helpers — gracefully degrade when storage is unavailable
// ---------------------------------------------------------------------------

function safeGetStorage(type: "session" | "local"): Storage | null {
  try {
    return type === "session" ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Frequência "visit": usa localStorage para persistir entre sessões, mas um
 * marcador em sessionStorage (`__visit_active__`) indica que a aba atual já
 * iniciou uma visita. Quando o marcador está ausente (nova aba/janela), todas
 * as marcas "visit" são limpas antes de verificar — assim o pop-up reaparece
 * na nova visita, mas não em cada navegação interna da mesma aba.
 *
 * "session": sessionStorage (limpo ao fechar a aba).
 * "lifetime": localStorage permanente (nunca limpo automaticamente).
 */
const VISIT_MARKER = "__visit_active__";

function ensureVisitMarker(): void {
  const session = safeGetStorage("session");
  if (!session) return;
  try {
    if (session.getItem(VISIT_MARKER) === null) {
      // Nova visita detectada: limpa todas as marcas "visit" do localStorage
      const local = safeGetStorage("local");
      if (local) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < local.length; i++) {
          const k = local.key(i);
          if (k?.startsWith("popup-seen-")) keysToRemove.push(k);
        }
        keysToRemove.forEach((k) => local.removeItem(k));
      }
      session.setItem(VISIT_MARKER, "1");
    }
  } catch {
    // Storage indisponível — degradação segura
  }
}

function hasSeenPopup(id: string, frequency: PopupAnnouncement["popupFrequency"]): boolean {
  if (frequency === "visit") {
    ensureVisitMarker();
    const storage = safeGetStorage("local");
    if (!storage) return false;
    return storage.getItem(`popup-seen-${id}`) !== null;
  }
  const storage = safeGetStorage(frequency === "session" ? "session" : "local");
  if (!storage) return false;
  return storage.getItem(`popup-seen-${id}`) !== null;
}

function markAsSeen(id: string, frequency: PopupAnnouncement["popupFrequency"]): void {
  const type = frequency === "session" ? "session" : "local";
  const storage = safeGetStorage(type);
  if (!storage) return;
  try {
    storage.setItem(`popup-seen-${id}`, "1");
  } catch {
    // Storage cheio ou bloqueado — ignora silenciosamente
  }
}

// ---------------------------------------------------------------------------
// Hook: mounted check (evita portal no SSR)
// ---------------------------------------------------------------------------

const noopSubscribe = () => () => {};

function useMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

interface AnnouncementPopupProps {
  popups: PopupAnnouncement[];
}

/**
 * Exibe o primeiro pop-up elegível (já filtrado por vigência e prioridade no servidor).
 * Respeita a frequência configurada e não aparece no painel admin.
 */
export function AnnouncementPopup({ popups }: AnnouncementPopupProps) {
  const mounted = useMounted();
  const [activePopup, setActivePopup] = useState<PopupAnnouncement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Seleciona o primeiro pop-up não visto após o mount
  useEffect(() => {
    // Não exibir no painel admin (exceto em modo preview via evento customizado)
    if (window.location.pathname.startsWith("/admin")) return;

    for (const popup of popups) {
      if (!hasSeenPopup(popup.id, popup.popupFrequency)) {
        setActivePopup(popup);
        break;
      }
    }
  }, [popups]);

  // Listener para pré-visualização no admin — não marca como visto
  useEffect(() => {
    function handlePreview(e: Event) {
      const detail = (e as CustomEvent<PopupAnnouncement>).detail;
      if (detail) setActivePopup(detail);
    }
    window.addEventListener("popup-preview", handlePreview);
    return () => window.removeEventListener("popup-preview", handlePreview);
  }, []);

  // Abre o dialog quando activePopup é definido
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !activePopup) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    dialog.showModal();

    // Pré-visualização (id === "__preview__") não marca como visto
    if (activePopup.id !== "__preview__") {
      markAsSeen(activePopup.id, activePopup.popupFrequency);
    }
  }, [activePopup]);

  function handleClose() {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    setActivePopup(null);

    // Retorna foco ao elemento que abriu o dialog
    previousFocusRef.current?.focus();
  }

  if (!mounted || !activePopup) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onCancel={handleClose}
      aria-label={activePopup.title}
      className="fixed inset-0 m-auto h-fit max-h-[90vh] w-[92vw] max-w-lg rounded-2xl border border-white/10 bg-black p-0 text-white backdrop:bg-black/80 backdrop:backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200"
    >
      {/* Botão fechar */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Fechar aviso"
        className="absolute right-3 top-3 z-10 rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        <X size={20} />
      </button>

      <div className="max-h-[90vh] overflow-y-auto">
        {/* Imagem opcional */}
        {activePopup.imageUrl && (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-2xl bg-white/5">
            <Image
              src={activePopup.imageUrl}
              alt=""
              fill
              sizes="(max-width: 512px) 92vw, 512px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Conteúdo */}
        <div className="flex flex-col gap-4 px-6 py-8 sm:px-8">
          <h2 className="font-display text-2xl leading-tight tracking-wide text-white sm:text-3xl">
            {activePopup.title}
          </h2>

          <p className="text-sm leading-relaxed text-white/80 sm:text-base">
            {activePopup.description}
          </p>

          {/* Botão de ação */}
          {activePopup.popupButtonText && activePopup.popupButtonUrl && (
            <a
              href={activePopup.popupButtonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-black transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              {activePopup.popupButtonText}
            </a>
          )}
        </div>
      </div>
    </dialog>,
    document.body
  );
}