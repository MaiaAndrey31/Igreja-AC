import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * Sitemap estático — uma unidade só, então sem loop de páginas dinâmicas por
 * item. As rotas alimentadas pelo banco (/avisos, /galeria, /celulas) entram
 * como a página-índice — os itens dentro delas não têm URL própria.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/sobre", priority: 0.9, changeFrequency: "monthly" },
    { path: "/ministerios", priority: 0.7, changeFrequency: "monthly" },
    { path: "/celulas", priority: 0.8, changeFrequency: "weekly" },
    { path: "/mensagens", priority: 0.7, changeFrequency: "weekly" },
    { path: "/avisos", priority: 0.6, changeFrequency: "weekly" },
    { path: "/galeria", priority: 0.5, changeFrequency: "monthly" },
    { path: "/contribua", priority: 0.5, changeFrequency: "yearly" },
    { path: "/politica-de-privacidade", priority: 0.2, changeFrequency: "yearly" },
    { path: "/termos-de-uso", priority: 0.2, changeFrequency: "yearly" },
    { path: "/direito-de-imagem", priority: 0.2, changeFrequency: "yearly" },
  ];

  return routes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
