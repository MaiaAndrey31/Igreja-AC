import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/site";
import { Reveal } from "@/components/ui/Reveal";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { ContactFormTrigger } from "@/components/site/ContactFormTrigger";
import type { UnitInfo } from "@/lib/firebase/collections";

/**
 * Seção editorial de células na home — layout de duas colunas com fotografia.
 *
 * Substitui a versão anterior que exibia dezenas de bairros em tags.
 * Os filtros por bairro permanecem disponíveis na página /celulas.
 *
 * Fotografia: culto-pregacao.jpg (asset real da igreja).
 * Quando uma foto específica de célula estiver disponível, substituir
 * o src abaixo sem alterar a estrutura do componente.
 */
export function CellReach({ unit }: { unit: UnitInfo }) {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <SectionEyebrow index={3} verseReference={unit.verseReference}>
          Comunidade que cuida
        </SectionEyebrow>

        <div className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Coluna esquerda — texto e botões */}
          <Reveal className="flex flex-col justify-center gap-6">
            <h2 className="font-display text-[clamp(2rem,5vw,4rem)] uppercase leading-[0.92] text-foreground">
              Igreja também acontece numa sala de estar.
            </h2>

            <p className="max-w-xl text-lg leading-relaxed text-foreground-muted">
              Acreditamos que a igreja vai além das paredes de um templo. Nas
              células, compartilhamos a vida, fortalecemos a fé e construímos
              relacionamentos. Existe um lugar para você.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/celulas"
                className="inline-flex items-center justify-center gap-2 bg-accent px-7 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-accent-contrast transition-opacity hover:opacity-85"
              >
                Encontre uma célula
                <ArrowRight size={14} />
              </Link>

              <ContactFormTrigger
                type="celula"
                modalTitle="Quero uma célula"
                modalDescription="Deixe seu contato que alguém te apresenta a célula mais perto de você."
                whatsappHref={whatsappUrl(
                  unit.contactPhoneE164,
                  `Olá! Vim pelo site da ${unit.shortName} e gostaria de entrar em uma célula.`
                )}
                className="inline-flex items-center justify-center gap-2 border border-border-soft px-7 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                <MessageCircle size={14} />
                Fale com a gente
              </ContactFormTrigger>
            </div>
          </Reveal>

          {/* Coluna direita — fotografia horizontal (4:3) para mostrar o grupo reunido */}
          <Reveal className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
            <Image
              src="/assets/cells.png"
              alt="Grupo de pessoas reunidas em uma célula da Igreja Amor & Cuidado, compartilhando comunhão e estudo bíblico"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
              quality={90}
              priority={false}
            />
            {/* Overlay sutil para garantir contraste consistente com o fundo escuro */}
            <div className="absolute inset-0 bg-ink/10" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}