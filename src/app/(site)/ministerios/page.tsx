import type { Metadata } from "next";
import { renderMinistryIcon } from "@/components/home/icon-map";
import { whatsappUrl } from "@/lib/site";
import { PageHeader } from "@/components/ui/PageHeader";
import { getPublishedMinistries, getUnitInfo } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const unit = await getUnitInfo();
  return {
    title: "Ministérios",
    description: `As frentes da ${unit.name} — cadastradas e mantidas pela própria igreja.`,
    alternates: { canonical: "/ministerios" },
  };
}

export default async function MinisteriosPage() {
  const [ministries, unit] = await Promise.all([getPublishedMinistries(), getUnitInfo()]);

  return (
    <div>
      <PageHeader
        eyebrow="Servir"
        title="Ministérios"
        description="As frentes da igreja — cada uma cuidando de uma parte da casa."
        meta={ministries.length > 0 ? `${ministries.length} frentes` : undefined}
      />

      <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 sm:pb-32">
        {ministries.length === 0 ? (
          <div className="border-t border-border-subtle pt-8">
            <p className="text-base leading-relaxed text-foreground-muted">
              Os ministérios ainda não foram publicados nesta página. Fale com a gente para saber onde servir.
            </p>
          </div>
        ) : (
          ministries.map((ministry, index) => (
            // `scroll-mt` compensa o header fixo quando se chega por âncora
            // vinda da home.
            <section
              key={ministry.id}
              id={ministry.id}
              className="grid scroll-mt-24 gap-6 border-t border-border-subtle py-12 sm:grid-cols-12 sm:gap-8 sm:py-16"
            >
              <div className="sm:col-span-4">
                <p className="font-data text-[11px] text-foreground-subtle">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <div className="mt-3 flex h-12 w-12 items-center justify-center border border-border-soft text-accent">
                  {renderMinistryIcon(ministry.icon, { size: 20, strokeWidth: 1.7 })}
                </div>
                <h2 className="font-display mt-4 text-4xl uppercase text-foreground sm:text-5xl">
                  {ministry.title}
                </h2>
                {ministry.highlight && (
                  <p className="font-data mt-3 text-[11px] uppercase tracking-[0.16em] text-accent">
                    Em destaque
                  </p>
                )}
              </div>

              <div className="sm:col-span-6 sm:col-start-6">
                <p className="text-base leading-relaxed text-foreground-muted">{ministry.description}</p>
              </div>
            </section>
          ))
        )}

        <div className="border-t border-border-subtle pt-12">
          <p className="font-display max-w-2xl text-3xl uppercase text-foreground sm:text-4xl">
            Tem lugar para o que você sabe fazer.
          </p>
          <a
            href={whatsappUrl(
              unit.contactPhoneE164,
              `Olá! Vim pelo site da ${unit.shortName} e quero servir em um ministério.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center gap-2 bg-accent px-7 py-4 text-[11px] uppercase tracking-[0.18em] text-accent-contrast transition-opacity hover:opacity-85"
          >
            Quero servir
          </a>
        </div>
      </div>
    </div>
  );
}
