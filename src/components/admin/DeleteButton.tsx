"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface DeleteButtonProps {
  confirmMessage: string;
  action: () => Promise<void>;
}

export function DeleteButton({ confirmMessage, action }: DeleteButtonProps) {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();

  function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    startTransition(async () => {
      try {
        await action();
        push("Removido com sucesso.");
      } catch {
        push("Não foi possível remover.", "error");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label="Excluir"
      className="rounded-lg p-2 text-foreground-subtle transition-colors hover:bg-red-950/30 hover:text-red-300 disabled:opacity-50"
    >
      {pending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
    </button>
  );
}
