import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { whatsappUrl } from "@/lib/site";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { ContactFormTrigger } from "@/components/site/ContactFormTrigger";
import type { UnitInfo, FormSubmissionType } from "@/lib/firebase/collections";

const cardContentClassName = "group flex h-full flex-col p-7 text-left sm:p-8";

function CardContent({ label, description }: { label: string; description: string }) {
  return (
    <>
      <span className="font-display block text-3xl uppercase text-foreground transition-colors group-hover:text-accent sm:text-4xl">
        {label}
      </span>
      <span className="mt-3 block text-sm leading-relaxed text-foreground-subtle">{description}</span>
      <span className="mt-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-accent">
        Ir
        <ArrowRight size={14} />
      </span>
    </>
  );
}

/**
 * Os cinco caminhos de entrada. Os três últimos abrem um formulário curto
 * (nome/contato/mensagem, salvo em `formSubmissions` — ver /admin/contatos),
 * com o WhatsApp como canal imediato de fallback, em vez de um link `wa.me`
 * direto: quem preenche fica registrado para a equipe não perder o contato.
 */
export function GetInvolved({ unit }: { unit: UnitInfo }) {
  const formPaths: { type: FormSubmissionType; label: string; description: string; message: string }[] = [
    {
      type: "decisao",
      label: "Decisão por Jesus",
      description: "Quer dar esse passo? Fale com a gente agora.",
      message: `Olá! Vim pelo site da ${unit.shortName} e quero fazer uma decisão por Jesus.`,
    },
    {
      type: "testemunho",
      label: "Tenho um testemunho",
      description: "Deus fez algo na sua vida? Conte pra gente.",
      message: `Olá! Vim pelo site da ${unit.shortName} e quero compartilhar um testemunho.`,
    },
    {
      type: "oracao",
      label: "Pedido de oração",
      description: "Oração, dúvida ou conversa. Alguém responde.",
      message: `Olá! Vim pelo site da ${unit.shortName} e tenho um pedido de oração.`,
    },
  ];

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <SectionEyebrow index={8} verseReference={unit.verseReference}>
          Quero fazer parte
        </SectionEyebrow>

        <ul className="mt-12 grid gap-px border-t border-border-subtle bg-border-subtle sm:grid-cols-2 lg:grid-cols-3">
          <li className="bg-background">
            <Link href="/sobre" className={cardContentClassName}>
              <CardContent
                label="Sou novo aqui"
                description="Saiba o que esperar da sua primeira visita e como chegar até nós."
              />
            </Link>
          </li>
          <li className="bg-background">
            <Link href="/celulas" className={cardContentClassName}>
              <CardContent
                label="Quero uma célula"
                description="Grupos que se reúnem durante a semana, em Adamantina e região."
              />
            </Link>
          </li>

          {formPaths.map((path) => (
            <li key={path.type} className="bg-background">
              <ContactFormTrigger
                type={path.type}
                modalTitle={path.label}
                whatsappHref={whatsappUrl(unit.contactPhoneE164, path.message)}
                className={cardContentClassName}
              >
                <CardContent label={path.label} description={path.description} />
              </ContactFormTrigger>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
