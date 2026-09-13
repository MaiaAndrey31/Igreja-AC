import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { getUnitInfo } from "@/lib/data";

export const metadata: Metadata = {
  title: "Termos de Uso",
  alternates: { canonical: "/termos-de-uso" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border-subtle py-8 first:border-t-0 first:pt-0">
      <h2 className="font-display text-xl tracking-wide text-foreground">{title}</h2>
      <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-foreground-subtle">{children}</div>
    </section>
  );
}

export default async function TermosDeUsoPage() {
  const unit = await getUnitInfo();

  return (
    <div>
      <PageHeader eyebrow="Jurídico" title="Termos de Uso" />

      <div className="mx-auto max-w-3xl px-5 pb-24 sm:px-8">
        <Section title="1. Aceitação">
          <p>
            Ao acessar este site, você concorda com estes Termos de Uso, com a nossa{" "}
            <a href="/politica-de-privacidade" className="text-foreground underline decoration-accent/50 underline-offset-2 hover:text-accent">
              Política de Privacidade
            </a>{" "}
            e com o aviso de{" "}
            <a href="/direito-de-imagem" className="text-foreground underline decoration-accent/50 underline-offset-2 hover:text-accent">
              Direito de Imagem
            </a>
            .
          </p>
        </Section>

        <Section title="2. Finalidade do site">
          <p>
            Este site tem finalidade institucional: apresentar a {unit.name}, sua história, ministérios,
            células e programação, além de viabilizar contribuições financeiras voluntárias à instituição.
          </p>
        </Section>

        <Section title="3. Conteúdo">
          <p>
            Todo o conteúdo (textos, imagens, vídeos e identidade visual) é de propriedade da {unit.name} ou
            usado com a devida autorização, sendo vedada sua reprodução comercial sem consentimento prévio por
            escrito.
          </p>
        </Section>

        <Section title="4. Contribuições">
          <p>
            As informações de doação (chave Pix e dados bancários) são fornecidas para fins de transparência e
            facilidade de contribuição. A responsabilidade pela conferência dos dados antes de qualquer transferência
            é do doador — veja os avisos de segurança na página{" "}
            <a href="/contribua" className="text-foreground underline decoration-accent/50 underline-offset-2 hover:text-accent">
              Contribua
            </a>
            . As contribuições são voluntárias e não geram direito a reembolso, exceto em caso de erro comprovado de
            transferência.
          </p>
        </Section>

        <Section title="5. Uso adequado">
          <p>
            É vedado utilizar este site para fins ilícitos, tentativas de acesso não autorizado ao painel
            administrativo, ou qualquer atividade que comprometa sua segurança ou disponibilidade.
          </p>
        </Section>

        <Section title="6. Alterações">
          <p>
            Estes termos podem ser atualizados periodicamente para refletir mudanças legais ou operacionais. A data
            de última atualização é sempre indicada no topo de cada página jurídica.
          </p>
        </Section>

        <Section title="7. Contato">
          <p>
            Dúvidas sobre estes termos podem ser enviadas para{" "}
            <a
              href={`mailto:${unit.contactEmail}`}
              className="text-foreground underline decoration-accent/50 underline-offset-2 hover:text-accent"
            >
              {unit.contactEmail}
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}
