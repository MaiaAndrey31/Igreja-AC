/**
 * Configuração centralizada de fontes personalizadas usando next/font/local.
 *
 * Família: Helvetica Neue LT Std
 * Arquivos disponíveis em src/lib/font/:
 * - HelveticaNeueLTStd Lt.otf (Light)
 * - HelveticaNeueLTStd-Cn.otf (Condensed Regular)
 * - HelveticaNeueLTStd-BdCn.otf (Bold Condensed)
 * - HelveticaNeueLTStd-LtCn.otf (Light Condensed)
 * - HelveticaNeueLTStd-It.otf (Italic)
 *
 * Nota: os arquivos são OTF (não WOFF2). next/font/local suporta OTF
 * nativamente e faz otimização automática no build da Vercel.
 */

import localFont from "next/font/local";

/**
 * Fonte principal do site — Helvetica Neue LT Std Light.
 * Usada como corpo de texto e base tipográfica.
 */
export const helveticaNeue = localFont({
 src: [
 {
 path: "./font/HelveticaNeueLTStd Lt.otf",
 weight: "300",
 style: "normal",
 },
 {
 path: "./font/HelveticaNeueLTStd-It.otf",
 weight: "300",
 style: "italic",
 },
 {
 path: "./font/HelveticaNeueLTStd-Cn.otf",
 weight: "400",
 style: "normal",
 },
 {
 path: "./font/HelveticaNeueLTStd-BdCn.otf",
 weight: "700",
 style: "normal",
 },
 ],
 variable: "--font-helvetica-neue",
 display: "swap",
 fallback: ["Helvetica", "Arial", "ui-sans-serif", "system-ui", "sans-serif"],
});