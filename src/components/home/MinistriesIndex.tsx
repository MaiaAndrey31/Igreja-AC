import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { renderMinistryIcon } from "@/components/home/icon-map";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import type { MinistryCardData } from "@/lib/data";

/**
 * Navegação editorial dos ministérios — lista numerada, não grade corporativa.
 *
 * Os itens vêm do painel `/admin/ministerios`: são os pastores quem cadastram,
 * ordenam e publicam cada frente, sem precisar mexer em código. Enquanto
 * nada estiver publicado, a seção some da home (mesmo comportamento do
 * carrossel que ela substituiu).
 */
export function MinistriesIndex({ ministries }: { ministries: MinistryCardData[] }) {
  if (ministries.length === 0) return null;

  return (
    <section className="on-paper">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <SectionEyebrow index={6}>Ministérios locais</SectionEyebrow>

        <ol className="mt-12">
          {ministries.map((ministry, index) => (
            <li key={ministry.id}>
              <Link
                href={`/ministerios#${ministry.id}`}
                className="group grid grid-cols-[2.5rem_1fr] items-center gap-x-4 gap-y-2 border-t border-border-subtle py-7 sm:grid-cols-[3.5rem_2.5rem_minmax(0,1fr)_2rem] sm:gap-x-6 sm:py-8"
              >
                <span className="font-data text-[11px] text-foreground-subtle">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="hidden h-10 w-10 shrink-0 items-center justify-center border border-border-soft text-accent transition-colors group-hover:border-accent sm:flex">
                  {renderMinistryIcon(ministry.icon, { size: 18, strokeWidth: 1.7 })}
                </span>

                <span>
                  <span className="font-display block text-3xl uppercase text-foreground transition-colors group-hover:text-accent sm:text-4xl">
                    {ministry.title}
                    {ministry.highlight && (
                      <span className="font-data ml-3 align-middle text-[11px] uppercase tracking-[0.16em] text-accent">
                        Destaque
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block max-w-2xl text-sm leading-relaxed text-foreground-subtle">
                    {ministry.description}
                  </span>
                </span>

                <span className="hidden items-center justify-end text-foreground-subtle transition-colors group-hover:text-accent sm:flex">
                  <ArrowRight size={16} />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
