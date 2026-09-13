import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PixKeyCopy } from "@/components/doacoes/PixKeyCopy";
import { BankDetails } from "@/components/doacoes/BankDetails";
import { Pending } from "@/components/ui/Pending";
import { getSiteSettings } from "@/lib/data";
import { hasRealBankDetails, hasRealPixKey } from "@/lib/donation";

export const metadata: Metadata = {
  title: "Contribua",
  description: "Como contribuir com a Igreja Amor e Cuidado.",
  alternates: { canonical: "/contribua" },
};

// Chave PIX e dados bancários vêm do painel admin — precisa ser sempre
// o dado mais atual, sem margem pra erro (dinheiro real envolvido).
export const dynamic = "force-dynamic";

export default async function ContribuaPage() {
  const settings = await getSiteSettings();
  const showPix = hasRealPixKey(settings);
  const showBank = hasRealBankDetails(settings);

  return (
    <div>
      <PageHeader
        eyebrow="Contribuição"
        title="Contribua"
        description="Sua contribuição sustenta os ministérios, a estrutura e as ações sociais da igreja."
      />

      <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 sm:pb-32">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            {showPix || showBank ? (
              <div className="flex flex-col gap-px bg-border-subtle">
                {showPix && <PixKeyCopy pixKey={settings.pixKey} pixKeyType={settings.pixKeyType} />}
                {showBank && (
                  <BankDetails
                    bankName={settings.bankName}
                    bankAgency={settings.bankAgency}
                    bankAccount={settings.bankAccount}
                    bankHolder={settings.bankHolder}
                  />
                )}
              </div>
            ) : (
              <div className="border-t border-border-subtle pt-8">
                <Pending label="chave Pix e dados bancários" />
                <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground-muted">
                  Os dados oficiais de contribuição ainda não foram publicados. Nenhum dado financeiro é exibido
                  aqui antes de a igreja confirmá-lo — se você recebeu uma chave Pix em nome da igreja por
                  mensagem, não use.
                </p>
              </div>
            )}

            {(showPix || showBank) && (
              <div className="mt-10 flex items-start gap-4 border border-border-soft p-6">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-accent" />
                <div className="text-sm leading-relaxed text-foreground-muted">
                  <p className="font-medium text-foreground">Antes de transferir, confirme os dados</p>
                  <p className="mt-2 text-foreground-subtle">
                    Confira sempre o titular e a chave exibidos nesta página oficial antes de concluir qualquer
                    transferência. A igreja nunca solicita doações por links de pagamento enviados via mensagem,
                    WhatsApp ou redes sociais. Em caso de dúvida, procure a secretaria pessoalmente.
                  </p>
                </div>
              </div>
            )}
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <h2 className="text-[11px] uppercase tracking-[0.22em] text-accent">Prestação de contas</h2>
            <p className="mt-6 border-t border-border-subtle pt-6 text-sm leading-relaxed text-foreground-subtle">
              Toda a arrecadação é registrada contabilmente e prestada em contas periodicamente aos membros da
              igreja, em conformidade com as exigências legais aplicáveis a instituições religiosas.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
