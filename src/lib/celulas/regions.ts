/**
 * Constantes de regiões de células — isomorfo (seguro para client e server).
 *
 * As cores e labels são centralizadas aqui para uso em mapa, filtros, badges
 * e painel admin. Este arquivo NÃO importa `server-only` nem Firebase.
 */

export const CELL_REGIONS = {
  vermelha: { label: "Vermelha", color: "#E5484D" },
  verde: { label: "Verde", color: "#22C55E" },
  amarela: { label: "Amarela", color: "#EAB308" },
  azul: { label: "Azul", color: "#3B82F6" },
  laranja: { label: "Laranja", color: "#F97316" },
} as const;

export type CellRegion = keyof typeof CELL_REGIONS;

export type CellProfile =
  | "Normal"
  | "Adultos"
  | "Casais - Alive"
  | "Moças - Alive Up"
  | "Mista - Alive Livre"
  | "Mista - Alive Up"
  | "Adolescente"
  | "Adolescentes e Jovens"
  | "Universitária - Mista"
  | "Crianças - Kids";

export type GeocodeStatus = "verified" | "pending" | "failed" | "manual";
export type ReviewStatus = "ok" | "needs_review";