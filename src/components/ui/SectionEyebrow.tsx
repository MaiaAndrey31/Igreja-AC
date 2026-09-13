import { cn } from "@/lib/utils";

/** Mesmo valor de `UNIT_INFO_DEFAULTS.verseReference` — usado só como marca
 * tipográfica decorativa (ver comentário abaixo), não como dado exibido em
 * bloco. Páginas que já têm a unidade carregada podem passar `verseReference`
 * para refletir uma edição feita em /admin/unidade; as demais (a maioria das
 * páginas, via `PageHeader`) usam este texto de identidade, estável por
 * natureza — não vale encadear `unit` por todo o site só por este detalhe. */
const DEFAULT_VERSE_REFERENCE = "João 21:17";

/**
 * Cabeça de seção: número + rótulo, com a referência de João 21:17 como marca
 * tipográfica discreta na outra ponta da linha.
 *
 * O versículo é a assinatura recorrente da identidade — origem do nome da
 * igreja. Ele aparece pequeno e repetido, ao lado do número da seção, nunca
 * como citação decorativa em corpo grande.
 */
export function SectionEyebrow({
  index,
  children,
  mark = true,
  verseReference = DEFAULT_VERSE_REFERENCE,
  className,
}: {
  /** Número da seção, ex.: 3 → "03". */
  index?: number;
  children: React.ReactNode;
  /** Desligue nas seções onde a marca competiria com outro elemento. */
  mark?: boolean;
  verseReference?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-6 border-t border-border-subtle pt-4", className)}>
      <p className="flex items-baseline gap-3 text-[11px] uppercase tracking-[0.28em] text-accent">
        {index !== undefined && (
          <span className="font-data text-[11px] tracking-normal text-foreground-subtle">
            {String(index).padStart(2, "0")}
          </span>
        )}
        <span>{children}</span>
      </p>
      {mark && (
        <span
          aria-hidden="true"
          className="font-data shrink-0 text-[10px] tracking-normal text-foreground-subtle/70"
        >
          {verseReference.replace("João ", "Jo ").replace(":", ".")}
        </span>
      )}
    </div>
  );
}
