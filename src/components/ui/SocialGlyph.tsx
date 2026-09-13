import { Mail, Link2 } from "lucide-react";
import type { SocialPlatform } from "@/lib/firebase/collections";

/**
 * lucide-react não traz ícones de marca (removidos por questão de trademark),
 * então os glifos de rede são desenhados aqui — mesmo peso visual (stroke 1.8,
 * viewBox 24) dos ícones lucide usados ao redor.
 */

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function SocialGlyph({ id, size = 18 }: { id: SocialPlatform; size?: number }) {
  const shared = { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true } as const;

  switch (id) {
    case "youtube":
      return (
        <svg {...shared} {...strokeProps}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
          <path d="M10.5 9.5v5l4.5-2.5-4.5-2.5z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "other":
      return <Link2 size={size} strokeWidth={1.8} aria-hidden="true" />;
    case "instagram":
      return (
        <svg {...shared} {...strokeProps}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...shared} {...strokeProps}>
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...shared} {...strokeProps}>
          <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-4-1L3 21l2-5.5a8.5 8.5 0 0 1-1-4A8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />
          <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l.8-1.6-2-1-.9.9a5.6 5.6 0 0 1-1.7-1.7l.9-.9-1-2z" />
        </svg>
      );
    case "email":
      return <Mail size={size} strokeWidth={1.8} aria-hidden="true" />;
  }
}
