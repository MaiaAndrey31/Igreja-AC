import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Usado sempre que uma entidade ainda não tem imagem real cadastrada. Em vez
 * de fazer hotlink de banco de imagens de terceiros (custo de performance e
 * risco de direitos autorais), mostramos um tile discreto convidando a
 * substituição pelo painel admin.
 */
export function MediaPlaceholder({ label, className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-surface-2 to-surface text-center",
        className
      )}
    >
      <ImageIcon size={22} className="text-foreground-subtle" strokeWidth={1.5} />
      {label && <p className="max-w-[80%] text-[11px] leading-snug text-foreground-subtle">{label}</p>}
    </div>
  );
}
