/**
 * Canais oficiais da Amor e Cuidado em Adamantina — todos verificados
 * publicamente. Boa parte do tráfego chega pelo link da bio do Instagram.
 *
 * O Linktree (linktr.ee/iacadamantina) confirma a existência de um canal no
 * YouTube, mas não temos o handle/URL exato dele — por isso não entra aqui
 * (a regra do projeto é não inventar link).
 */

import { unit, whatsappUrl } from "./unit";

export type SocialId = "instagram" | "facebook" | "whatsapp" | "email";

export interface SocialLink {
  id: SocialId;
  label: string;
  /** Identificador público, como a igreja o divulga. */
  handle: string;
  href: string;
  /** Links externos abrem em nova aba; `mailto:`/`tel:` não. */
  external: boolean;
}

export const socialLinks: SocialLink[] = [
  {
    id: "instagram",
    label: "Instagram",
    handle: "@iacadamantina",
    href: "https://www.instagram.com/iacadamantina",
    external: true,
  },
  {
    id: "facebook",
    label: "Facebook",
    handle: "IACadamantina",
    href: "https://www.facebook.com/IACadamantina",
    external: true,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    handle: unit.contact.phoneDisplay,
    href: whatsappUrl(`Olá! Vim pelo site da ${unit.shortName} e gostaria de falar com alguém.`),
    external: true,
  },
  {
    id: "email",
    label: "E-mail",
    handle: unit.contact.email,
    href: `mailto:${unit.contact.email}`,
    external: false,
  },
];

export function getSocialLink(id: SocialId): SocialLink {
  const link = socialLinks.find((social) => social.id === id);
  if (!link) throw new Error(`Canal social não cadastrado: ${id}`);
  return link;
}
