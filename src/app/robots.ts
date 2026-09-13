import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // O painel é protegido por sessão (ver src/proxy.ts); mantê-lo fora do
      // índice evita expor a tela de login nos resultados de busca.
      disallow: "/admin",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
