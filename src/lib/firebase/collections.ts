import "server-only";
import type { DocumentData, FirestoreDataConverter, Timestamp } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";

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
  heroFocusY: number;
  heroVideoUrl: string;
  heroPosterUrl: string;
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
  heroFocusY: 35,
  heroVideoUrl: "/videos/hero-placeholder.mp4",
  heroPosterUrl: "/videos/hero-poster.jpg",
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
      heroFocusY: data.heroFocusY,
      heroVideoUrl: data.heroVideoUrl,
      heroPosterUrl: data.heroPosterUrl,
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
