import { ImageResponse } from "next/og";

/**
 * Favicon dinâmico gerado via Image Response do Next.js.
 * Usa a logo vertical branca da igreja sobre fundo escuro (#14120F).
 *
 * Este arquivo é automaticamente detectado pelo App Router como ícone
 * do site, resolvendo o erro 404 em /favicon.ico sem necessidade de
 * arquivo estático separado.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
 return new ImageResponse(
 (
 <div
 style={{
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 width: "100%",
 height: "100%",
 backgroundColor: "#14120F",
 borderRadius: "6px",
 }}
 >
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src="https://iacadamantina.com.br/assets/brand/BrancaVertical.png"
 alt=""
 width={24}
 height={28}
 style={{ objectFit: "contain" }}
 />
 </div>
 ),
 { ...size }
 );
}