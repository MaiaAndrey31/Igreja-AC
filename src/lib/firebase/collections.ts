import "server-only";
import type { DocumentData, FirestoreDataConverter, Timestamp } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import type { Weekday } from "@/lib/services";

/**
 * Coleções Firestore e seus conversores — o equivalente aos models do Prisma.
 *
 * Cada `withConverter` faz o Firestore devolver/receber objetos já tipados,
 * com `createdAt`/`updatedAt`/datas de negócio convertidas entre
 * `Timestamp` (formato nativo do Firestore) e `Date` (o que o resto do app
 * espera — nenhum componente React precisou mudar por causa disso).
 *
 * IDs são o próprio id do documento (Firestore os gera automaticamente,
 * como o `cuid()` do Prisma fazia) — sempre lidos via `snapshot.id`, nunca
 * gravados como campo dentro do documento.
 */

// ---------------------------------------------------------------------------
// Ministry
// ---------------------------------------------------------------------------

export interface Ministry {
  id: string;
  title: string;
  description: string;
  icon: string;
  highlight: boolean;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type MinistryInput = Omit<Ministry, "id" | "createdAt" | "updatedAt">;

const ministryConverter: FirestoreDataConverter<Ministry> = {
  toFirestore(ministry) {
    return toFirestoreData(ministry);
  },
  fromFirestore(snap) {
    const data = snap.data();
    return {
      id: snap.id,
      title: data.title,
      description: data.description,
      icon: data.icon,
      highlight: data.highlight,
      order: data.order,
      published: data.published,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  },
};

export const ministriesCollection = () => db().collection("ministries").withConverter(ministryConverter);
/**
 * Referência sem o conversor, usada nas Server Actions de escrita.
 *
 * `Ministry` (o `AppModelType` do conversor acima) inclui `id` porque isso é
 * o que torna as leituras convenientes (`doc.id` já vem anexado no objeto).
 * Mas isso torna `.add()`/`.update()` tipados incômodos na escrita — o TS
 * exigiria um `id` que ainda não existe ao criar. A referência crua evita
 * esse atrito: escreve/atualiza objetos simples, sem o campo `id`.
 */
export const ministriesRaw = () => db().collection("ministries");

// ---------------------------------------------------------------------------
// Cell
// ---------------------------------------------------------------------------

export interface Cell {
  id: string;
  name: string;
  leaderName: string;
  neighborhood: string;
  address: string;
  dayTime: string;
  whatsapp: string;
  logoUrl: string | null;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CellInput = Omit<Cell, "id" | "createdAt" | "updatedAt">;

const cellConverter: FirestoreDataConverter<Cell> = {
  toFirestore(cell) {
    return toFirestoreData(cell);
  },
  fromFirestore(snap) {
    const data = snap.data();
    return {
      id: snap.id,
      name: data.name,
      leaderName: data.leaderName,
      neighborhood: data.neighborhood,
      address: data.address,
      dayTime: data.dayTime,
      whatsapp: data.whatsapp,
      logoUrl: data.logoUrl ?? null,
      active: data.active,
      order: data.order,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  },
};

export const cellsCollection = () => db().collection("cells").withConverter(cellConverter);
/** Ver comentário em `ministriesRaw` — mesma razão. */
export const cellsRaw = () => db().collection("cells");

// ---------------------------------------------------------------------------
// Announcement
// ---------------------------------------------------------------------------

export interface Announcement {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  instagramUrl: string | null;
  category: string;
  startDate: Date;
  endDate: Date | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type AnnouncementInput = Omit<Announcement, "id" | "createdAt" | "updatedAt">;

const announcementConverter: FirestoreDataConverter<Announcement> = {
  toFirestore(announcement) {
    return toFirestoreData(announcement);
  },
  fromFirestore(snap) {
    const data = snap.data();
    return {
      id: snap.id,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl ?? null,
      instagramUrl: data.instagramUrl ?? null,
      category: data.category,
      startDate: toDate(data.startDate),
      endDate: data.endDate ? toDate(data.endDate) : null,
      published: data.published,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  },
};

export const announcementsCollection = () =>
  db().collection("announcements").withConverter(announcementConverter);
/** Ver comentário em `ministriesRaw` — mesma razão. */
export const announcementsRaw = () => db().collection("announcements");

// ---------------------------------------------------------------------------
// GalleryImage
// ---------------------------------------------------------------------------

export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  eventName: string | null;
  order: number;
  createdAt: Date;
}

export type GalleryImageInput = Omit<GalleryImage, "id" | "createdAt">;

const galleryImageConverter: FirestoreDataConverter<GalleryImage> = {
  toFirestore(image) {
    return toFirestoreData(image);
  },
  fromFirestore(snap) {
    const data = snap.data();
    return {
      id: snap.id,
      url: data.url,
      alt: data.alt,
      eventName: data.eventName ?? null,
      order: data.order,
      createdAt: toDate(data.createdAt),
    };
  },
};

export const galleryCollection = () => db().collection("gallery").withConverter(galleryImageConverter);
/** Ver comentário em `ministriesRaw` — mesma razão. */
export const galleryRaw = () => db().collection("gallery");

// ---------------------------------------------------------------------------
// SiteSettings — documento único ("singleton"), mesmo padrão do Prisma antes
// ---------------------------------------------------------------------------

export interface SiteSettings {
  heroMediaType: string;
  /** "upload" (vídeo enviado, em heroVideoUrl) ou "youtube" (heroYoutubeId). */
  heroVideoSource: string;
  heroFocusY: number;
  heroVideoUrl: string;
  heroYoutubeId: string;
  /**
   * Fotos do carrossel de fundo, na ordem em que alternam — tanto o fundo do
   * modo "Foto" quanto o poster (frame de espera) do modo "Vídeo" usam
   * `heroPosterUrls[0]`, não existe mais um campo de foto única separado. Uma
   * foto só = fundo fixo; duas ou mais = alternam automaticamente. Lista
   * gerenciada por `addHeroPhotoAction`/`removeHeroPhotoAction` (não pelo
   * formulário grande de `updateSettingsAction`) — daí `updateSettingsAction`
   * gravar com `{ merge: true }`, pra nunca sobrescrever esta lista à toa.
   */
  heroPosterUrls: string[];
  heroTitle: string;
  heroSubtitle: string;
  donationText: string;
  pixKeyType: string;
  pixKey: string;
  bankName: string;
  bankAgency: string;
  bankAccount: string;
  bankHolder: string;
  updatedAt: Date;
}

export const SITE_SETTINGS_DEFAULTS: Omit<SiteSettings, "updatedAt"> = {
  heroMediaType: "video",
  heroVideoSource: "upload",
  heroFocusY: 35,
  heroVideoUrl: "/videos/hero-placeholder.mp4",
  heroYoutubeId: "",
  heroPosterUrls: [],
  heroTitle: "Amor e Cuidado em Adamantina",
  heroSubtitle: "Uma igreja pastoreada por células, em Adamantina e região.",
  donationText:
    "Sua contribuição sustenta os ministérios, a estrutura e as ações sociais da igreja. Toda a arrecadação é registrada e prestada em contas periodicamente aos membros.",
  pixKeyType: "CNPJ",
  pixKey: "",
  bankName: "",
  bankAgency: "",
  bankAccount: "",
  bankHolder: "",
};

const siteSettingsConverter: FirestoreDataConverter<SiteSettings> = {
  toFirestore(settings) {
    return toFirestoreData(settings);
  },
  fromFirestore(snap) {
    const data = snap.data();
    return {
      heroMediaType: data.heroMediaType,
      // `?? "upload"` cobre documentos salvos antes deste campo existir.
      heroVideoSource: data.heroVideoSource ?? "upload",
      heroFocusY: data.heroFocusY,
      heroVideoUrl: data.heroVideoUrl,
      heroYoutubeId: data.heroYoutubeId ?? "",
      heroPosterUrls: Array.isArray(data.heroPosterUrls) ? data.heroPosterUrls : [],
      heroTitle: data.heroTitle,
      heroSubtitle: data.heroSubtitle,
      donationText: data.donationText,
      pixKeyType: data.pixKeyType,
      pixKey: data.pixKey,
      bankName: data.bankName,
      bankAgency: data.bankAgency,
      bankAccount: data.bankAccount,
      bankHolder: data.bankHolder,
      updatedAt: toDate(data.updatedAt),
    };
  },
};

export const siteSettingsDoc = () =>
  db().collection("settings").doc("site").withConverter(siteSettingsConverter);

// ---------------------------------------------------------------------------
// Leader — liderança local, editável pelo painel (substitui src/data/leaders.ts)
// ---------------------------------------------------------------------------

export interface Leader {
  id: string;
  name: string;
  role: string;
  quote: string | null;
  photoUrl: string | null;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export type LeaderInput = Omit<Leader, "id" | "createdAt" | "updatedAt">;

const leaderConverter: FirestoreDataConverter<Leader> = {
  toFirestore(leader) {
    return toFirestoreData(leader);
  },
  fromFirestore(snap) {
    const data = snap.data();
    return {
      id: snap.id,
      name: data.name,
      role: data.role,
      quote: data.quote ?? null,
      photoUrl: data.photoUrl ?? null,
      active: data.active,
      order: data.order,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  },
};

export const leadersCollection = () => db().collection("leaders").withConverter(leaderConverter);
/** Ver comentário em `ministriesRaw` — mesma razão. */
export const leadersRaw = () => db().collection("leaders");

// ---------------------------------------------------------------------------
// Message — pregações em destaque (substitui src/data/messages.ts)
// ---------------------------------------------------------------------------

export interface Message {
  id: string;
  title: string;
  speaker: string;
  date: Date;
  youtubeId: string;
  published: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export type MessageInput = Omit<Message, "id" | "createdAt" | "updatedAt">;

const messageConverter: FirestoreDataConverter<Message> = {
  toFirestore(message) {
    return toFirestoreData(message);
  },
  fromFirestore(snap) {
    const data = snap.data();
    return {
      id: snap.id,
      title: data.title,
      speaker: data.speaker,
      date: toDate(data.date),
      youtubeId: data.youtubeId,
      published: data.published,
      order: data.order,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  },
};

export const messagesCollection = () => db().collection("messages").withConverter(messageConverter);
/** Ver comentário em `ministriesRaw` — mesma razão. */
export const messagesRaw = () => db().collection("messages");

// ---------------------------------------------------------------------------
// SocialLink — canais oficiais (substitui src/data/socialLinks.ts)
// ---------------------------------------------------------------------------

export type SocialPlatform = "instagram" | "facebook" | "whatsapp" | "email" | "youtube" | "other";

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  label: string;
  handle: string;
  href: string;
  external: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export type SocialLinkInput = Omit<SocialLink, "id" | "createdAt" | "updatedAt">;

const socialLinkConverter: FirestoreDataConverter<SocialLink> = {
  toFirestore(link) {
    return toFirestoreData(link);
  },
  fromFirestore(snap) {
    const data = snap.data();
    return {
      id: snap.id,
      platform: data.platform,
      label: data.label,
      handle: data.handle,
      href: data.href,
      external: data.external,
      order: data.order,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  },
};

export const socialLinksCollection = () => db().collection("socialLinks").withConverter(socialLinkConverter);
/** Ver comentário em `ministriesRaw` — mesma razão. */
export const socialLinksRaw = () => db().collection("socialLinks");

// ---------------------------------------------------------------------------
// Service — horários de celebração (substitui unit.services em
// src/data/unit.ts). `Weekday` mora em src/lib/services.ts (usado também por
// componente client, que não pode importar este módulo `server-only`).
// ---------------------------------------------------------------------------

export interface Service {
  id: string;
  weekday: Weekday;
  time: string;
  label: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceInput = Omit<Service, "id" | "createdAt" | "updatedAt">;

const serviceConverter: FirestoreDataConverter<Service> = {
  toFirestore(service) {
    return toFirestoreData(service);
  },
  fromFirestore(snap) {
    const data = snap.data();
    return {
      id: snap.id,
      weekday: data.weekday,
      time: data.time,
      label: data.label ?? null,
      order: data.order,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  },
};

export const servicesCollection = () => db().collection("services").withConverter(serviceConverter);
/** Ver comentário em `ministriesRaw` — mesma razão. */
export const servicesRaw = () => db().collection("services");

// ---------------------------------------------------------------------------
// UnitInfo — identidade institucional (substitui o resto de src/data/unit.ts)
// Documento único ("singleton"), mesmo padrão de SiteSettings: nasce com os
// valores atualmente hardcoded na primeira leitura (ver getUnitInfo em
// src/lib/data.ts), então não precisa de script de seed separado.
// ---------------------------------------------------------------------------

export interface UnitInfo {
  name: string;
  shortName: string;
  initials: string;
  tagline: string;
  verseReference: string;
  verseExcerpt: string;
  verseReading: string;
  modelTitle: string;
  modelDescription: string;
  isFirstExtension: boolean;
  foundedYear: number;
  foundedDateLabel: string;
  foundingMembers: number;
  originStory: string;
  newTempleYear: number;
  newTempleStory: string;
  address: string;
  city: string;
  state: string;
  contactEmail: string;
  contactPhoneDisplay: string;
  contactPhoneE164: string;
  cellsCountLabel: string;
  networkName: string;
  networkSite: string;
  networkHeadquartersCity: string;
  networkHeadquartersState: string;
  networkFoundedYear: number;
  updatedAt: Date;
}

/** Valores hoje vigentes (fonte: antigo src/data/unit.ts) — viram o primeiro documento gravado. */
export const UNIT_INFO_DEFAULTS: Omit<UnitInfo, "updatedAt"> = {
  name: "Igreja Amor e Cuidado em Adamantina",
  shortName: "Amor e Cuidado Adamantina",
  initials: "AC",
  tagline: "Um lugar de céus abertos!",
  verseReference: "João 21:17",
  verseExcerpt: "Cuide das minhas ovelhas",
  verseReading: "Primeiro o amor a Jesus. Depois o cuidado com as pessoas.",
  modelTitle: "Igreja pastoreada por células",
  modelDescription: "Tudo acontece através delas.",
  isFirstExtension: true,
  foundedYear: 2014,
  foundedDateLabel: "26 de junho de 2014",
  foundingMembers: 47,
  originStory:
    "Começou informalmente numa garagem no centro de Adamantina, em 2013. Tornou-se oficialmente uma congregação em 26 de junho de 2014, com um grupo de 47 pessoas — adultos, jovens e adolescentes —, com sede inicial na Alameda Porto Alegre, na Vila Jamil de Lima.",
  newTempleYear: 2024,
  newTempleStory:
    "Em novembro de 2024, a igreja inaugurou seu novo templo no Parque do Sol — um espaço que antes abrigava uma concessionária de veículos, reformado ao longo daquele ano. A inauguração teve dois dias de celebração: terça-feira, com a presença do Bispo Marcelo Toschi e do Ministério de Música da Amor e Cuidado, e quarta-feira, conduzida pelo pastor de adoração local, Lucas Donha.",
  address: "Av. José Urbano Luize, 781 — Parque do Sol, Adamantina/SP",
  city: "Adamantina",
  state: "SP",
  contactEmail: "iacadamantina@gmail.com",
  contactPhoneDisplay: "(18) 3880-0209",
  contactPhoneE164: "551838800209",
  cellsCountLabel: "70+",
  networkName: "Amor e Cuidado",
  networkSite: "https://amorecuidado.com.br",
  networkHeadquartersCity: "Araçatuba",
  networkHeadquartersState: "SP",
  networkFoundedYear: 1936,
};

const unitInfoConverter: FirestoreDataConverter<UnitInfo> = {
  toFirestore(info) {
    return toFirestoreData(info);
  },
  fromFirestore(snap) {
    const data = snap.data();
    return {
      name: data.name,
      shortName: data.shortName,
      initials: data.initials,
      tagline: data.tagline,
      verseReference: data.verseReference,
      verseExcerpt: data.verseExcerpt,
      verseReading: data.verseReading,
      modelTitle: data.modelTitle,
      modelDescription: data.modelDescription,
      isFirstExtension: data.isFirstExtension,
      foundedYear: data.foundedYear,
      foundedDateLabel: data.foundedDateLabel,
      foundingMembers: data.foundingMembers,
      originStory: data.originStory,
      newTempleYear: data.newTempleYear,
      newTempleStory: data.newTempleStory,
      address: data.address,
      city: data.city,
      state: data.state,
      contactEmail: data.contactEmail,
      contactPhoneDisplay: data.contactPhoneDisplay,
      contactPhoneE164: data.contactPhoneE164,
      cellsCountLabel: data.cellsCountLabel,
      networkName: data.networkName,
      networkSite: data.networkSite,
      networkHeadquartersCity: data.networkHeadquartersCity,
      networkHeadquartersState: data.networkHeadquartersState,
      networkFoundedYear: data.networkFoundedYear,
      updatedAt: toDate(data.updatedAt),
    };
  },
};

export const unitInfoDoc = () => db().collection("settings").doc("unit").withConverter(unitInfoConverter);

// ---------------------------------------------------------------------------
// FormSubmission — envios dos formulários públicos (célula, decisão,
// testemunho, oração) — a "caixa de entrada" do painel.
// ---------------------------------------------------------------------------

export type FormSubmissionType = "celula" | "decisao" | "testemunho" | "oracao";
export type FormSubmissionStatus = "novo" | "atendido";

export interface FormSubmission {
  id: string;
  type: FormSubmissionType;
  name: string;
  contact: string;
  message: string | null;
  status: FormSubmissionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type FormSubmissionInput = Omit<FormSubmission, "id" | "createdAt" | "updatedAt" | "status">;

const formSubmissionConverter: FirestoreDataConverter<FormSubmission> = {
  toFirestore(submission) {
    return toFirestoreData(submission);
  },
  fromFirestore(snap) {
    const data = snap.data();
    return {
      id: snap.id,
      type: data.type,
      name: data.name,
      contact: data.contact,
      message: data.message ?? null,
      status: data.status,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  },
};

export const formSubmissionsCollection = () =>
  db().collection("formSubmissions").withConverter(formSubmissionConverter);
/** Ver comentário em `ministriesRaw` — mesma razão. */
export const formSubmissionsRaw = () => db().collection("formSubmissions");

// ---------------------------------------------------------------------------
// formRateLimit — throttling best-effort por IP+tipo para o formulário
// público (sem sessão, então não dá pra usar requireAdminSession). Mesmo
// espírito de adminSecurity: sobrevive a restart do servidor.
// ---------------------------------------------------------------------------

export interface FormRateLimitDoc {
  count: number;
  windowStartsAt: Date;
}

const formRateLimitConverter: FirestoreDataConverter<FormRateLimitDoc> = {
  toFirestore(value) {
    return toFirestoreData(value);
  },
  fromFirestore(snap) {
    const data = snap.data();
    return {
      count: data.count ?? 0,
      windowStartsAt: toDate(data.windowStartsAt),
    };
  },
};

/** `key` é `${ip}:${type}`, já normalizado por quem chama. */
export const formRateLimitDoc = (key: string) =>
  db().collection("formRateLimit").doc(encodeURIComponent(key)).withConverter(formRateLimitConverter);

// ---------------------------------------------------------------------------
// adminSecurity — contador de tentativas de login, por e-mail (ver
// src/lib/auth/rateLimit.ts). Não tem equivalente de UI pública; existe só
// para o bloqueio de força bruta sobreviver a restart do servidor.
// ---------------------------------------------------------------------------

export interface AdminSecurityDoc {
  failedAttempts: number;
  lockedUntil: Date | null;
}

const adminSecurityConverter: FirestoreDataConverter<AdminSecurityDoc> = {
  toFirestore(value) {
    return toFirestoreData(value);
  },
  fromFirestore(snap) {
    const data = snap.data();
    return {
      failedAttempts: data.failedAttempts ?? 0,
      lockedUntil: data.lockedUntil ? toDate(data.lockedUntil) : null,
    };
  },
};

/** `email` deve chegar já normalizado (trim + lowercase) — é a chave do documento. */
export const adminSecurityDoc = (email: string) =>
  db().collection("adminSecurity").doc(encodeURIComponent(email)).withConverter(adminSecurityConverter);

// ---------------------------------------------------------------------------
// Helpers compartilhados pelos conversores acima
// ---------------------------------------------------------------------------

function toDate(value: Timestamp | Date | undefined): Date {
  if (!value) return new Date(0);
  return value instanceof Date ? value : value.toDate();
}

/**
 * Remove `id` (é o id do doc, nunca um campo) e troca `undefined` por
 * `FieldValue.delete()` — o SDK do Firestore rejeita `undefined` em
 * `set()`/`update()`, diferente do Prisma que aceitava `null`/omissão.
 *
 * Só entra em jogo se algum dia `toFirestore` voltar a ser usado por uma
 * escrita tipada (hoje as Server Actions escrevem pelas referências "Raw",
 * sem conversor — ver o comentário em `ministriesRaw`). O parâmetro aceita
 * qualquer objeto (`object`, não `Record<string, unknown>`) porque é isso
 * que os tipos gerados pelo Firestore (`WithFieldValue<T>`) entregam — um
 * `interface` concreto, sem index signature.
 */
function toFirestoreData(value: object): DocumentData {
  const data: DocumentData = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (key === "id") continue;
    data[key] = val === undefined ? FieldValue.delete() : val;
  }
  return data;
}
