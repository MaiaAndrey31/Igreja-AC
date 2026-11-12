import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { getUnitInfo } from "@/lib/data";
import { siteUrl } from "@/lib/site";
import { helveticaNeue } from "@/lib/fonts";
import "./globals.css";

/**
 * Tipografia oficial: Helvetica Neue LT Std (local) como fonte padrão.
 * IBM Plex Mono permanece apenas para dados operacionais (horários, datas).
 * Big Shoulders e Inter foram removidos — a Helvetica Neue substitui ambas
 * como corpo de texto e títulos em todo o site e painel admin.
 */
const data = IBM_Plex_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const description =
  "Igreja pastoreada por células em Adamantina/SP — a primeira extensão da rede Amor e Cuidado.";

// `getUnitInfo` já é cacheada por requisição (React `cache()`) — chamar aqui
// não gera uma segunda leitura no Firestore além da que o layout público
// (`(site)/layout.tsx`) já faz para Header/Footer.
export async function generateMetadata(): Promise<Metadata> {
  const unit = await getUnitInfo();
  const title = `${unit.name} — ${unit.tagline}`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${unit.shortName}`,
    },
    description,
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: unit.name,
      title,
      description,
      url: siteUrl,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = {
  themeColor: "#14120F",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${data.variable} ${helveticaNeue.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning só neste elemento: extensões de navegador
          (ex.: ColorZilla, Grammarly) injetam atributos no <body> antes do
          React hidratar — isso é inofensivo, mas sem isso o console mostra
          um aviso de mismatch a cada visitante que tiver alguma instalada.
          Não silencia mismatches reais de conteúdo, só de atributos deste
          elemento específico. */}
      <body className="min-h-full flex flex-col bg-ink" suppressHydrationWarning>
        <MotionProvider>
          <ToastProvider>{children}</ToastProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
