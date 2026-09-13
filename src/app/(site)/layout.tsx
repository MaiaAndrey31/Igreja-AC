import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { getSocialLinks, getUnitInfo } from "@/lib/data";

// Header/Footer aparecem em toda página pública, e ambos leem dados editáveis
// pelo painel (nome, endereço, redes sociais) — precisam refletir uma edição
// recente, sem depender de cache de build.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [unit, socialLinks] = await Promise.all([getUnitInfo(), getSocialLinks()]);

  return (
    <>
      <Header unit={unit} />
      <main className="flex-1">{children}</main>
      <Footer unit={unit} socialLinks={socialLinks} />
      <CookieConsentBanner />
    </>
  );
}
