import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { getUnitInfo } from "@/lib/data";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  alternates: { canonical: "/politica-de-privacidade" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border-subtle py-8 first:border-t-0 first:pt-0">
      <h2 className="font-display text-xl tracking-wide text-foreground">{title}</h2>
      <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-foreground-subtle">{children}</div>
    </section>
  );
}

export default async function PoliticaDePrivacidadePage() {
  const unit = await getUnitInfo();

  return (
    <div>
      <PageHeader eyebrow="Jurídico" title="Política de Privacidade" />

      <div className="mx-auto max-w-3xl px-5 pb-24 sm:px-8">
        <p className="font-data text-sm text-foreground-subtle">Última atualização: setembro de 2026.</p>

        <Section title="1. Quem trata os seus dados">
          <p>
            A {unit.name}, associação religiosa sediada em {unit.city}/{unit.state}, é a controladora dos
            dados pessoais tratados por meio deste site, nos termos da Lei nº 13.709/2018 (Lei Geral de
            Proteção de Dados — LGPD).
          </p>
        </Section>

        <Section title="2. Quais dados podem ser coletados">
          <p>Este site, em sua operação atual, coleta apenas:</p>
          <ul className="list-disc pl-5">
            <li>Dados de navegação técnicos essenciais ao funcionamento (ex.: preferência de cookies salva no seu navegador).</li>
            <li>
              Dados fornecidos voluntariamente por você em canais de contato direto (WhatsApp, e-mail ou secretaria) —
              como nome, telefone e eventuais pedidos de oração — quando você opta por entrar em contato com uma
              célula ou com a igreja.
            </li>
          </ul>
          <p>Não utilizamos formulários de coleta automática de dados pessoais neste site além do descrito acima.</p>
        </Section>

        <Section title="3. Finalidade do tratamento">
          <p>
            Os dados eventualmente recebidos são usados exclusivamente para responder ao seu contato, organizar a
            participação em células e ministérios, e para a comunicação institucional da igreja com seus membros e
            visitantes.
          </p>
        </Section>

        <Section title="4. Base legal">
          <p>
            O tratamento se baseia no consentimento do titular (Art. 7º, I, LGPD), quando você inicia voluntariamente
            um contato, e no legítimo interesse da instituição religiosa na organização de suas atividades
            (Art. 7º, IX, LGPD).
          </p>
        </Section>

        <Section title="5. Compartilhamento e comercialização">
          <p>
            <strong className="text-foreground-muted">Seus dados não são vendidos, alugados ou comercializados</strong>{" "}
            com terceiros sob nenhuma hipótese. Dados de contato podem ser compartilhados internamente apenas com o
            líder da célula ou ministério relevante, para fins de acolhimento.
          </p>
        </Section>

        <Section title="6. Retenção">
          <p>
            Dados de contato são mantidos pelo tempo necessário ao relacionamento com a igreja e podem ser
            removidos a qualquer momento mediante solicitação, conforme a Seção 8 abaixo.
          </p>
        </Section>

        <Section title="7. Cookies">
          <p>
            Utilizamos apenas cookies essenciais ao funcionamento do site (ex.: guardar sua preferência de
            consentimento). Essa escolha fica salva localmente no seu navegador e não é enviada aos nossos
            servidores. Caso no futuro sejam adicionadas ferramentas de análise de tráfego, o banner de cookies
            exibido neste site será atualizado para refletir essa mudança e solicitar seu consentimento específico.
          </p>
        </Section>

        <Section title="8. Seus direitos (Art. 18 da LGPD)">
          <p>Você pode, a qualquer momento e gratuitamente, solicitar:</p>
          <ul className="list-disc pl-5">
            <li>Confirmação da existência de tratamento e acesso aos seus dados;</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>Exclusão dos dados tratados com base no seu consentimento;</li>
            <li>Portabilidade dos dados a outro fornecedor de serviço;</li>
            <li>Revogação do consentimento, a qualquer momento.</li>
          </ul>
          <p>
            Para exercer qualquer um desses direitos, entre em contato pelo e-mail{" "}
            <a
              href={`mailto:${unit.contactEmail}`}
              className="text-foreground underline decoration-accent/50 underline-offset-2 hover:text-accent"
            >
              {unit.contactEmail}
            </a>
            .
          </p>
        </Section>

        <Section title="9. Direito de imagem">
          <p>
            O tratamento de fotos e vídeos captados nos espaços e cultos da igreja é regido por regras próprias —
            consulte a página de{" "}
            <a href="/direito-de-imagem" className="text-foreground underline decoration-accent/50 underline-offset-2 hover:text-accent">
              Direito de Imagem
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}
