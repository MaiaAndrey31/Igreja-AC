/**
 * Identidade da Igreja Amor e Cuidado em Adamantina — esta unidade, não a
 * rede nacional. Todo campo vem de fonte pública verificada: Instagram
 * (@iacadamantina), Facebook (IACadamantina), Linktree (linktr.ee/iacadamantina),
 * a página oficial da unidade em amorecuidado.com.br e matérias jornalísticas
 * locais sobre a inauguração do novo templo (nov/2024). Nada foi preenchido
 * por inferência — o que não tinha fonte vira `PENDING` (ver ./pending) na UI.
 *
 * A rede nacional (sede em Araçatuba/SP, 1936) aparece só como contexto de
 * pertencimento — ver `unit.network` — nunca como protagonista do site.
 */

/** 0 = domingo … 6 = sábado (mesma convenção de `Date#getDay`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Service {
  weekday: Weekday;
  /** "HH:MM" em horário local. */
  time: string;
  /** Ex.: "Juventude Alive". Ausente = celebração regular. */
  label?: string;
}

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

export const unit = {
  name: "Igreja Amor e Cuidado em Adamantina",
  shortName: "Amor e Cuidado Adamantina",
  initials: "AC",

  /** Como a própria unidade se descreve no Facebook. */
  tagline: "Um lugar de céus abertos!",

  /** Origem do nome da marca — João 21:17, Jesus a Pedro. Mesma identidade da rede. */
  verse: {
    reference: "João 21:17",
    excerpt: "Cuide das minhas ovelhas",
    reading: "Primeiro o amor a Jesus. Depois o cuidado com as pessoas.",
  },

  /** Modelo eclesial da rede, vivido localmente. */
  model: {
    title: "Igreja pastoreada por células",
    description: "Tudo acontece através delas.",
  },

  /** É a primeira extensão da rede — credencial forte, vale contar. */
  isFirstExtension: true,
  foundedYear: 2014,
  foundedDateLabel: "26 de junho de 2014",
  foundingMembers: 47,
  originStory:
    "Começou informalmente numa garagem no centro de Adamantina, em 2013. Tornou-se oficialmente uma congregação em 26 de junho de 2014, com um grupo de 47 pessoas — adultos, jovens e adolescentes —, com sede inicial na Alameda Porto Alegre, na Vila Jamil de Lima.",

  newTemple: {
    year: 2024,
    story:
      "Em novembro de 2024, a igreja inaugurou seu novo templo no Parque do Sol — um espaço que antes abrigava uma concessionária de veículos, reformado ao longo daquele ano. A inauguração teve dois dias de celebração: terça-feira, com a presença do Bispo Marcelo Toschi e do Ministério de Música da Amor e Cuidado, e quarta-feira, conduzida pelo pastor de adoração local, Lucas Donha.",
  },

  // CEP não verificado publicamente — se algum dia for exibido, use `Pending`.
  address: "Av. José Urbano Luize, 781 — Parque do Sol, Adamantina/SP",
  city: "Adamantina",
  state: "SP",

  contact: {
    email: "iacadamantina@gmail.com",
    phoneDisplay: "(18) 3880-0209",
    /** Mesmo número, no formato aceito por links wa.me / tel:. */
    phoneE164: "551838800209",
  },

  /** Fonte: Folha Regional, matéria sobre a inauguração do novo templo (nov/2024). */
  services: [
    { weekday: 2, time: "20:00" },
    { weekday: 6, time: "19:00", label: "Juventude Alive" },
    { weekday: 0, time: "09:00" },
    { weekday: 0, time: "16:00" },
    { weekday: 0, time: "18:30" },
  ] as Service[],

  /**
   * "Mais de 70" é o número da página oficial da unidade — usado aqui por
   * ser o mais conservador. Uma matéria local de início de 2026 chegou a
   * citar 102 células; ficou de fora por não ser a fonte oficial. Sinalizar
   * essa divergência à igreja antes de publicar, caso queiram atualizar.
   */
  cellsCount: "70+",

  /** Contexto de pertencimento à rede nacional — nunca o protagonista do site. */
  network: {
    name: "Amor e Cuidado",
    site: "https://amorecuidado.com.br",
    headquartersCity: "Araçatuba",
    headquartersState: "SP",
    foundedYear: 1936,
  },
};

export const whatsappUrl = (message?: string) =>
  `https://wa.me/${unit.contact.phoneE164}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(unit.address)}`;
