import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Inter, IBM_Plex_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { unit } from "@/data/unit";
import { siteUrl } from "@/lib/site";
import "./globals.css";

/**
 * Três papéis tipográficos (ver globals.css):
 * display condensada de alto contraste, corpo neutro, mono só para dado
 * operacional. `next/font` faz o self-host — o CSP do projeto trava
 * `font-src 'self'`, então nada é buscado do Google em runtime.
 *
 * "Big Shoulders Display" foi renomeada para "Big Shoulders" no Google Fonts;
 * é a mesma família citada no briefing de marca.
 */
const display = Big_Shoulders({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  display: "swap",
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const data = IBM_Plex_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const description =
  "Igreja pastoreada por células em Adamantina/SP — a primeira extensão da rede Amor e Cuidado.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${unit.name} — ${unit.tagline}`,
    template: `%s | ${unit.shortName}`,
  },
  description,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: unit.name,
    title: `${unit.name} — ${unit.tagline}`,
    description,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: `${unit.name} — ${unit.tagline}`,
    description,
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#14120F",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${body.variable} ${data.variable} h-full antialiased`}
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
