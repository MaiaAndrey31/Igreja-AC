import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { unit, whatsappUrl } from "@/data/unit";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

/**
 * Os cinco caminhos de entrada. Os três últimos já existem como CTAs reais
 * no Linktree da unidade (linktr.ee/iacadamantina) — aqui viram conversa no
 * WhatsApp, já que não temos a URL exata de cada um deles no Linktree (a
 * regra do projeto é não inventar link).
 */
export function GetInvolved() {
  const paths = [
    {
      label: "Sou novo aqui",
      description: "Saiba o que esperar da sua primeira visita e como chegar até nós.",
      href: "/sobre",
      external: false,
    },
    {
      label: "Quero uma célula",
      description: "Grupos que se reúnem durante a semana, em Adamantina e região.",
      href: "/celulas",
      external: false,
    },
    {
      label: "Decisão por Jesus",
      description: "Quer dar esse passo? Fale com a gente agora.",
      href: whatsappUrl(`Olá! Vim pelo site da ${unit.shortName} e quero fazer uma decisão por Jesus.`),
      external: true,
    },
    {
      label: "Tenho um testemunho",
      description: "Deus fez algo na sua vida? Conte pra gente.",
      href: whatsappUrl(`Olá! Vim pelo site da ${unit.shortName} e quero compartilhar um testemunho.`),
      external: true,
    },
    {
      label: "Pedido de oração",
      description: "Oração, dúvida ou conversa. Alguém responde.",
      href: whatsappUrl(`Olá! Vim pelo site da ${unit.shortName} e tenho um pedido de oração.`),
      external: true,
    },
  ];

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <SectionEyebrow index={8}>Quero fazer parte</SectionEyebrow>

        <ul className="mt-12 grid gap-px border-t border-border-subtle bg-border-subtle sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((path) => {
            const Icon = path.external ? ArrowUpRight : ArrowRight;
            const content = (
              <>
                <span className="font-display block text-3xl uppercase text-foreground transition-colors group-hover:text-accent sm:text-4xl">
                  {path.label}
                </span>
                <span className="mt-3 block text-sm leading-relaxed text-foreground-subtle">
                  {path.description}
                </span>
                <span className="mt-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-accent">
                  Ir
                  <Icon size={14} />
                </span>
              </>
            );

            return (
              <li key={path.label} className="bg-background">
                {path.external ? (
                  <a
                    href={path.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-full flex-col p-7 sm:p-8"
                  >
                    {content}
                  </a>
                ) : (
                  <Link href={path.href} className="group flex h-full flex-col p-7 sm:p-8">
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
