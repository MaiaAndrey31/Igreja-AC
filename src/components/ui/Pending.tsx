import { PENDING } from "@/data/pending";
import { cn } from "@/lib/utils";

/**
 * Mostra `[CONTEÚDO PENDENTE]` de um jeito só, em toda a UI.
 *
 * Em mono e com moldura tracejada de propósito: precisa ser óbvio para quem
 * revisa o site que ali falta um dado real, e impossível de confundir com
 * texto publicado.
 */
export function Pending({ label, className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "font-data inline-flex items-center gap-2 rounded-sm border border-dashed border-border-soft px-2 py-1 text-[11px] leading-none text-foreground-subtle",
        className
      )}
    >
      {PENDING}
      {label && <span className="opacity-70">· {label}</span>}
    </span>
  );
}
