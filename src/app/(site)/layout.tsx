import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { WhatsappButton } from "@/components/layout/WhatsappButton";
import { AnnouncementPopup } from "@/components/layout/AnnouncementPopup";
import { getEligiblePopups, getSiteSettings, getSocialLinks, getUnitInfo } from "@/lib/data";

// Header/Footer aparecem em toda página pública, e ambos leem dados editáveis
// pelo painel (nome, endereço, redes sociais) — precisam refletir uma edição
// recente, sem depender de cache de build.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [unit, socialLinks, popups, settings] = await Promise.all([
    getUnitInfo(),
    getSocialLinks(),
    getEligiblePopups(),
    getSiteSettings(),
  ]);

  return (
    <>
      <Header unit={unit} />
      <main className="flex-1">{children}</main>
      <Footer unit={unit} socialLinks={socialLinks} pixKey={settings.pixKey} pixKeyType={settings.pixKeyType} />
      <WhatsappButton phoneE164={unit.contactPhoneE164} />
      <CookieConsentBanner />
      <AnnouncementPopup popups={popups} />
    </>
  );
}
