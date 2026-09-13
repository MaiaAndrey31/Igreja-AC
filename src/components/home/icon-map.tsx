import {
  Baby,
  Heart,
  Music,
  Flame,
  Users,
  HandHeart,
  Sparkles,
  BookOpen,
  Mic2,
  Globe2,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

export const MINISTRY_ICON_OPTIONS = [
  { value: "baby", label: "Criança" },
  { value: "heart", label: "Coração" },
  { value: "music", label: "Música" },
  { value: "flame", label: "Jovens" },
  { value: "users", label: "Pessoas" },
  { value: "handheart", label: "Ação Social" },
  { value: "sparkles", label: "Intercessão" },
  { value: "bookopen", label: "Palavra" },
  { value: "mic2", label: "Louvor" },
  { value: "globe2", label: "Missões" },
] as const;

export const MINISTRY_ICONS: Record<string, LucideIcon> = {
  baby: Baby,
  heart: Heart,
  music: Music,
  flame: Flame,
  users: Users,
  handheart: HandHeart,
  sparkles: Sparkles,
  bookopen: BookOpen,
  mic2: Mic2,
  globe2: Globe2,
};

export const MINISTRY_ICON_NAMES = MINISTRY_ICON_OPTIONS.map((option) => option.value);

const LEGACY_ICON_MAP: Record<string, string> = {
  Heart: "heart",
  Music: "music",
  Flame: "flame",
  Users: "users",
  HandHeart: "handheart",
  Sparkles: "sparkles",
  BookOpen: "bookopen",
  Mic2: "mic2",
  Globe2: "globe2",
};

function normalizeMinistryIconName(name: string) {
  const trimmed = name?.trim();
  if (!trimmed) return "sparkles";
  return LEGACY_ICON_MAP[trimmed] ?? trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Renderiza o ícone já resolvido (em vez de retornar a referência do
 * componente para o chamador montar a tag `<Icon />`) — evita o padrão que o
 * eslint-plugin-react-hooks (`static-components`) sinaliza como "componente
 * criado durante a renderização", mesmo sendo, na prática, uma referência
 * estável vinda de um mapa em nível de módulo.
 */
export function renderMinistryIcon(name: string, props?: LucideProps) {
  const normalizedName = normalizeMinistryIconName(name);
  const Icon = MINISTRY_ICONS[normalizedName] ?? Sparkles;
  return <Icon {...props} />;
}
