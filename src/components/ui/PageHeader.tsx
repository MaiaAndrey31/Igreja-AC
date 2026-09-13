import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  /** Linha curta de dado operacional (conta, período, local) em mono. */
  meta?: React.ReactNode;
}

/**
 * Abertura das páginas internas: alinhada à esquerda e em grid assimétrico —
 * o título ocupa a coluna larga, o texto de apoio desce para a coluna da
 * direita. Nada centralizado, para manter o ritmo editorial da home.
 */
export function PageHeader({ eyebrow, title, description, meta }: PageHeaderProps) {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-14 pt-28 sm:px-8 sm:pb-20 sm:pt-40">
      <SectionEyebrow>{eyebrow}</SectionEyebrow>

      <h1 className="font-display mt-10 max-w-5xl text-[clamp(2.75rem,10vw,7rem)] uppercase text-foreground">
        {title}
      </h1>

      {(description || meta) && (
        <div className="mt-8 grid gap-4 sm:grid-cols-12">
          {description && (
            <p className="text-base leading-relaxed text-foreground-muted sm:col-span-6 sm:col-start-7">
              {description}
            </p>
          )}
          {meta && (
            <div className="font-data text-[11px] uppercase tracking-[0.16em] text-foreground-subtle sm:col-span-5 sm:col-start-7">
              {meta}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
