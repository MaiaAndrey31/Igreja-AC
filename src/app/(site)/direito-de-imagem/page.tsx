import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { getUnitInfo } from "@/lib/data";

export const metadata: Metadata = {
  title: "Direito de Imagem",
  alternates: { canonical: "/direito-de-imagem" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border-subtle py-8 first:border-t-0 first:pt-0">
      <h2 className="font-display text-xl tracking-wide text-foreground">{title}</h2>
      <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-foreground-subtle">{children}</div>
    </section>
  );
}

export default async function DireitoDeImagemPage() {
  const unit = await getUnitInfo();

  return (
    <div>
      <PageHeader eyebrow="Jurídico" title="Direito de Imagem e Voz" />

      <div className="mx-auto max-w-3xl px-5 pb-24 sm:px-8">
        <Section title="1. Captação em espaços e cultos públicos">
          <p>
            Os cultos, eventos e demais atividades da {unit.name} são, em regra, abertos ao público. Nesses
            espaços e ocasiões, é comum a captação de fotografias e vídeos por equipes de comunicação da igreja,
            para uso institucional, evangelístico e de divulgação da comunidade — em conformidade com o Art. 20 do
            Código Civil Brasileiro (Lei nº 10.406/2002).
          </p>
        </Section>

        <Section title="2. Finalidade de uso">
          <p>As imagens e vídeos captados podem ser utilizados em:</p>
          <ul className="list-disc pl-5">
            <li>Este site institucional (seções de Galeria e Avisos);</li>
            <li>Redes sociais oficiais da igreja;</li>
            <li>Materiais impressos ou digitais de divulgação de eventos;</li>
            <li>Registros históricos internos da comunidade.</li>
          </ul>
          <p>Não há uso comercial, publicitário de terceiros, ou cessão de imagens a outras instituições sem autorização específica.</p>
        </Section>

        <Section title="3. Menores de idade">
          <p>
            No caso de crianças e adolescentes participantes da Juventude Alive ou de outras atividades, a
            captação e uso de imagem seguem o mesmo princípio de finalidade institucional e evangelística, com
            especial cuidado editorial. Pais ou responsáveis que não desejem a exposição de imagem de seus filhos
            podem comunicar essa preferência à secretaria da igreja a qualquer momento.
          </p>
        </Section>

        <Section title="4. Como pedir a remoção de uma foto (opt-out)">
          <p>
            Se você identificar uma foto ou vídeo sua neste site e preferir que ela não seja exibida publicamente,
            você pode solicitar a remoção seguindo estes passos:
          </p>
          <ol className="list-decimal pl-5">
            <li>
              Envie um e-mail para{" "}
              <a
                href={`mailto:${unit.contactEmail}`}
                className="text-foreground underline decoration-accent/50 underline-offset-2 hover:text-accent"
              >
                {unit.contactEmail}
              </a>{" "}
              com o assunto &quot;Solicitação de remoção de imagem&quot;;
            </li>
            <li>Descreva onde a imagem está publicada (ex.: link da página de Galeria) ou anexe um print;</li>
            <li>A equipe de comunicação removerá a imagem em até 5 dias úteis e confirmará por e-mail.</li>
          </ol>
          <p>Você também pode fazer esse pedido pessoalmente na secretaria da igreja.</p>
        </Section>

        <Section title="5. Dúvidas">
          <p>
            Para qualquer dúvida sobre esta política, consulte também a nossa{" "}
            <a href="/politica-de-privacidade" className="text-foreground underline decoration-accent/50 underline-offset-2 hover:text-accent">
              Política de Privacidade
            </a>{" "}
            ou fale diretamente conosco.
          </p>
        </Section>
      </div>
    </div>
  );
}
