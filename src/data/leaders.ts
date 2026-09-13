/**
 * Liderança local da Amor e Cuidado em Adamantina — confirmada pela página
 * oficial de pastores da própria unidade (fonte de verdade; uma matéria de
 * jornal usada antes citava apenas dois nomes e ficou desatualizada).
 *
 * O Bispo Marcelo Toschi (pastor sênior de toda a rede) segue como
 * referência/pregador em outras partes do site — não é liderança do dia a
 * dia desta unidade, por isso não entra aqui.
 *
 * Fotos reais enviadas pela igreja, em `public/assets/leaders/`.
 */

export interface Leader {
  slug: string;
  name: string;
  role: string;
  quote: string | null;
  photoUrl: string | null;
}

export const leaders: Leader[] = [
  {
    slug: "leonardo-costa",
    name: "Leonardo Costa",
    role: "Pastor Sênior",
    quote: null,
    photoUrl: "/assets/leaders/leonardo-costa.webp",
  },
  {
    slug: "naiara-costa",
    name: "Naiara Costa",
    role: "Pastora Sênior",
    quote: null,
    photoUrl: "/assets/leaders/naiara-costa.webp",
  },
  {
    slug: "mariana-lemes",
    name: "Mariana Lemes",
    role: "Pastora — Intercessão, Profético e Sala de Cura",
    quote: null,
    photoUrl: "/assets/leaders/mariana-lemes.webp",
  },
  {
    slug: "larissa-marquezin",
    name: "Larissa Marquezin",
    role: "Pastora Alive Kids",
    quote: null,
    photoUrl: "/assets/leaders/larissa-marquezin.webp",
  },
  {
    slug: "matheus-magnani",
    name: "Matheus Magnani",
    role: "Pastor de Adoração",
    quote: null,
    photoUrl: "/assets/leaders/matheus-magnani.webp",
  },
  {
    slug: "antonio-marquette",
    name: "Antônio Marquette",
    role: "Pastor — Visitação e Oração (Casa Rayah)",
    quote: null,
    photoUrl: "/assets/leaders/antonio-marquette.webp",
  },
  {
    slug: "victor-costa",
    name: "Victor Costa",
    role: "Pastor Gestor e Finanças",
    quote: null,
    photoUrl: "/assets/leaders/victor-costa.webp",
  },
];
