"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";

const STORAGE_KEY = "irbc_cookie_consent";

interface ConsentChoice {
  essential: true;
  analytics: boolean;
  decidedAt: string;
}

function subscribe(): () => void {
  // Nada externo muda esse valor fora desta própria árvore de componentes,
  // então não há evento para assinar — o re-render acontece via o
  // useState local (`dismissed`) quando o próprio usuário decide.
  return () => {};
}

function hasStoredConsent(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return true; // localStorage indisponível: trata como já decidido, não exibe o banner.
  }
}

// No servidor assumimos "já decidido" para nunca piscar o banner durante o
// SSR/hidratação; useSyncExternalStore corrige para o valor real do
// navegador assim que o componente monta, sem precisar de um efeito manual.
function getServerSnapshot(): boolean {
  return true;
}

/**
 * Banner de consentimento LGPD. A escolha do visitante fica só no navegador
 * (localStorage) — o site não tem analytics de terceiros hoje, então não há
 * nada além do essencial para "bloquear"; a estrutura já fica pronta para
 * quando/se isso mudar, sem precisar registrar a escolha em servidor.
 */
export function CookieConsentBanner() {
  const hasConsent = useSyncExternalStore(subscribe, hasStoredConsent, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  function save(choice: Omit<ConsentChoice, "decidedAt">) {
    const value: ConsentChoice = { ...choice, decidedAt: new Date().toISOString() };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // localStorage indisponível (modo privado etc.) — apenas fecha o banner nesta sessão.
    }
    setDismissed(true);
  }

  if (hasConsent || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border-soft bg-surface/95 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <Cookie size={18} className="mt-0.5 shrink-0 text-accent" />
          <div className="flex-1">
            <p className="text-sm text-foreground-muted">
              Usamos apenas o essencial para o site funcionar. Nenhum dado de navegação é vendido ou compartilhado.
              Saiba mais na{" "}
              <Link href="/politica-de-privacidade" className="underline decoration-accent/50 underline-offset-2 hover:text-accent">
                Política de Privacidade
              </Link>
              .
            </p>

            {customizing && (
              <div className="mt-4 flex flex-col gap-3 border-t border-border-subtle pt-4">
                <Switch label="Cookies essenciais (sempre ativos)" checked disabled />
                <Switch
                  label="Cookies de análise (não utilizados atualmente neste site)"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                />
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <Button size="sm" onClick={() => save({ essential: true, analytics: true })}>
                Aceitar
              </Button>
              {customizing ? (
                <Button size="sm" variant="outline" onClick={() => save({ essential: true, analytics })}>
                  Salvar preferências
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setCustomizing(true)}>
                  Personalizar
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => save({ essential: true, analytics: false })}>
                Recusar não essenciais
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
