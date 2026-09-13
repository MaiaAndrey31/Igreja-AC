import { Hero } from "@/components/home/Hero";
import { OurStory } from "@/components/home/OurStory";
import { NextService } from "@/components/home/NextService";
import { CellReach } from "@/components/home/CellReach";
import { Leadership } from "@/components/home/Leadership";
import { LatestMessages } from "@/components/home/LatestMessages";
import { MinistriesIndex } from "@/components/home/MinistriesIndex";
import { NetworkFamily } from "@/components/home/NetworkFamily";
import { GetInvolved } from "@/components/home/GetInvolved";
import { ContributeTeaser } from "@/components/home/ContributeTeaser";
import { JsonLd } from "@/components/seo/JsonLd";
import { churchSchema } from "@/lib/schema";
import { heroSubtitle, heroTitle } from "@/lib/heroCopy";
import { getPublishedMinistries, getSiteSettings } from "@/lib/data";

// Hero e ministérios são editados pelo painel admin e precisam aparecer em
// tempo real pros visitantes, sem depender de cache de build.
export const dynamic = "force-dynamic";

/**
 * Home da unidade de Adamantina. Ordem: Hero → Nossa história → Próxima
 * celebração → Encontre uma célula → Liderança local → Assista →
 * Ministérios locais → Parte da família Amor e Cuidado → Quero fazer parte →
 * Contribua → Footer.
 *
 * Ritmo tinta → papel → tinta → papel…: o preto é cor real da marca, e a
 * troca de fundo é o que separa os blocos sem precisar de card. Cada seção
 * clara carrega a classe `.on-paper` (ver globals.css), que reescreve os
 * tokens semânticos para dentro dela.
 */
export default async function Home() {
  const [settings, ministries] = await Promise.all([getSiteSettings(), getPublishedMinistries()]);

  return (
    <>
      <JsonLd data={churchSchema()} />

      <Hero
        title={heroTitle(settings.heroTitle)}
        subtitle={heroSubtitle(settings.heroSubtitle)}
        mediaType={settings.heroMediaType === "image" ? "image" : "video"}
        videoUrl={settings.heroVideoUrl}
        posterUrl={settings.heroPosterUrl}
        focusY={settings.heroFocusY}
      />

      <OurStory />
      <NextService />
      <CellReach />
      <Leadership />
      <LatestMessages />
      <MinistriesIndex ministries={ministries} />
      <NetworkFamily />
      <GetInvolved />
      <ContributeTeaser />
    </>
  );
}
