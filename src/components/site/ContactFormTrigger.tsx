"use client";

import { useActionState, useId, useState } from "react";
import { MessageCircle } from "lucide-react";
import { submitFormAction } from "@/actions/formSubmissions";
import type { ActionState } from "@/actions/auth";
import { Modal } from "@/components/ui/Modal";
import { FieldGroup, Input, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { FormSubmissionType } from "@/lib/firebase/collections";

const emptyState: ActionState = {};

interface ContactFormTriggerProps {
  type: FormSubmissionType;
  modalTitle: string;
  modalDescription?: string;
  whatsappHref: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Botão que abre um formulário (nome/contato/mensagem) salvo em
 * `formSubmissions` — visível em `/admin/contatos`. Mantém o WhatsApp como
 * canal imediato (link de fallback dentro do modal e após o envio), em vez de
 * substituí-lo: quem prefere resolver na hora ainda pode, e quem preenche o
 * formulário fica registrado para a equipe não perder o contato.
 */
export function ContactFormTrigger({
  type,
  modalTitle,
  modalDescription,
  whatsappHref,
  className,
  children,
}: ContactFormTriggerProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(submitFormAction, emptyState);
  const idPrefix = useId();

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={modalTitle}>
        {state.success ? (
          <div className="flex flex-col gap-5">
            <p className="text-sm leading-relaxed text-foreground-muted">
              Recebemos sua mensagem — alguém da equipe vai te procurar em breve.
            </p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-border-soft px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              <MessageCircle size={14} />
              Continuar no WhatsApp agora
            </a>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="type" value={type} />
            {/* Honeypot: campo escondido do olho humano (fora da tela, não
                `display:none`, que alguns leitores de tela ignoram de forma
                inconsistente) — só um bot preenche. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px]"
            />

            {modalDescription && <p className="text-sm leading-relaxed text-foreground-muted">{modalDescription}</p>}

            <FieldGroup label="Nome" htmlFor={`${idPrefix}-name`}>
              <Input id={`${idPrefix}-name`} name="name" required />
            </FieldGroup>
            <FieldGroup label="WhatsApp ou e-mail" htmlFor={`${idPrefix}-contact`}>
              <Input id={`${idPrefix}-contact`} name="contact" required />
            </FieldGroup>
            <FieldGroup label="Mensagem (opcional)" htmlFor={`${idPrefix}-message`}>
              <Textarea id={`${idPrefix}-message`} name="message" />
            </FieldGroup>

            {state.error && <p className="text-sm text-red-400">{state.error}</p>}

            <SubmitButton className="mt-2">Enviar</SubmitButton>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-xs text-foreground-subtle underline underline-offset-2 transition-colors hover:text-accent"
            >
              Prefere ir direto pro WhatsApp?
            </a>
          </form>
        )}
      </Modal>
    </>
  );
}
