import { siteUrl } from "@/lib/site";
import type { Service, SocialLink, UnitInfo } from "@/lib/firebase/collections";

/**
 * schema.org para os buscadores — uma única unidade, então um único bloco
 * `Church`, com endereço e horários reais (vindos do Firestore, editáveis em
 * /admin/unidade e /admin/horarios).
 *
 * Regra do projeto vale aqui também: campo sem dado verificado não é emitido.
 * Um `openingHours` inventado ou um endereço aproximado viraria informação
 * errada no card do Google — pior do que campo ausente.
 */

const SCHEMA_WEEKDAY = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function churchSchema(unit: UnitInfo, socialLinks: SocialLink[], services: Service[]) {
  const openingHours = services.map((service) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: `https://schema.org/${SCHEMA_WEEKDAY[service.weekday]}`,
    opens: service.time,
    name: service.label ?? "Celebração",
  }));

  return {
    "@context": "https://schema.org",
    "@type": "Church",
    "@id": `${siteUrl}/#church`,
    name: unit.name,
    alternateName: unit.shortName,
    url: siteUrl,
    slogan: unit.tagline,
    foundingDate: String(unit.foundedYear),
    foundingLocation: `${unit.city}, ${unit.state}`,
    email: unit.contactEmail,
    telephone: `+${unit.contactPhoneE164}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: unit.address,
      addressLocality: unit.city,
      addressRegion: unit.state,
      addressCountry: "BR",
    },
    openingHoursSpecification: openingHours,
    sameAs: socialLinks.filter((social) => social.external).map((social) => social.href),
  };
}
