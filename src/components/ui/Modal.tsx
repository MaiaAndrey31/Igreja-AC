"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidthClassName?: string;
}

// Nunca muda depois do mount, então não precisa de um `subscribe` de verdade
// — só existe pra dar à API de useSyncExternalStore os dois retratos que ela
// espera (servidor vs. cliente). Mesmo truque de "isto já rodou no
// navegador?" usado em NextService.tsx.
const noopSubscribe = () => () => {};

/**
 * Renderiza via portal em `document.body`, não na posição onde o componente
 * é chamado. Um `<dialog>` já é exibido na "top layer" do navegador
 * independente de onde está no DOM, então isso não muda nada visualmente —
 * mas evita este `<form>` (o de dentro do Modal) acabar aninhado dentro de
 * outro `<form>` quando o Modal é usado dentro de uma tela que já é, ela
 * mesma, um formulário grande (ex.: `HeroPhotoManager` dentro de
 * `SettingsForm`) — HTML não permite `<form>` dentro de `<form>`, e o React
 * acusa isso como erro de hidratação.
 *
 * `mounted` evita o portal no primeiro render do servidor (onde `document`
 * não existe): `getServerSnapshot` devolve `false` só nesse primeiro render,
 * `getSnapshot` devolve `true` a partir do primeiro render no navegador.
 */
export function Modal({ open, onClose, title, children, maxWidthClassName = "max-w-lg" }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
      className={cn(
        "w-[92vw] rounded-2xl border border-border-soft bg-surface p-0 text-foreground backdrop:bg-black/70 backdrop:backdrop-blur-sm",
        maxWidthClassName
      )}
    >
      <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
        <h2 className="font-display text-lg tracking-wide">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="rounded-full p-1.5 text-foreground-subtle transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <X size={18} />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
    </dialog>,
    document.body
  );
}
