import "server-only";
import { cache } from "react";
import {
  announcementsCollection,
  cellsCollection,
  galleryCollection,
  leadersCollection,
  messagesCollection,
  ministriesCollection,
  servicesCollection,
  siteSettingsDoc,
  socialLinksCollection,
  unitInfoDoc,
  SITE_SETTINGS_DEFAULTS,
  UNIT_INFO_DEFAULTS,
  type Announcement,
  type Cell,
  type GalleryImage,
  type Leader,
  type Message,
  type Ministry,
  type Service,
  type SiteSettings,
  type SocialLink,
  type UnitInfo,
} from "@/lib/firebase/collections";

/**
 * Leituras públicas centralizadas — páginas (Server Components) chamam essas
 * funções diretamente via Admin SDK, sem passar por uma API HTTP intermediária
 * (menos latência, menos superfície exposta).
 *
 * Cada consulta com `where` + múltiplos `orderBy` abaixo exige um índice
 * composto no Firestore — todos estão declarados em `firestore.indexes.json`
 * na raiz do repo. Se um deles faltar em produção, a consulta falha com uma
 * mensagem de erro que já traz o link direto para criar o índice certo no
 * Console.
 */

export function getPublishedMinistries(): Promise<Ministry[]> {
  return ministriesCollection()
    .where("published", "==", true)
    .orderBy("highlight", "desc")
    .orderBy("order", "asc")
    .get()
    .then((snap) => snap.docs.map((doc) => doc.data()));
}

/** Forma de cada item retornado por `getPublishedMinistries` — usada pelos componentes públicos. */
export type MinistryCardData = Ministry;

export function getActiveCells(): Promise<Cell[]> {
  return cellsCollection()
    .where("active", "==", true)
    .orderBy("neighborhood", "asc")
    .orderBy("order", "asc")
    .get()
    .then((snap) => snap.docs.map((doc) => doc.data()));
}

/** Só a contagem — a home mostra quantas células existem, não a lista toda. */
export async function getActiveCellCount(): Promise<number> {
  const snap = await cellsCollection().where("active", "==", true).count().get();
  return snap.data().count;
}

export function getPublishedAnnouncements(limit?: number): Promise<Announcement[]> {
  let query = announcementsCollection().where("published", "==", true).orderBy("startDate", "asc");
  if (limit) query = query.limit(limit);
  return query.get().then((snap) => snap.docs.map((doc) => doc.data()));
}

export function getGalleryImages(limit?: number): Promise<GalleryImage[]> {
  let query = galleryCollection().orderBy("order", "asc").orderBy("createdAt", "desc");
  if (limit) query = query.limit(limit);
  return query.get().then((snap) => snap.docs.map((doc) => doc.data()));
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const ref = siteSettingsDoc();
  const snap = await ref.get();
  if (snap.exists) return snap.data()!;

  const initial = { ...SITE_SETTINGS_DEFAULTS, updatedAt: new Date() };
  await ref.set(initial);
  return initial;
}

export function getPublishedLeaders(): Promise<Leader[]> {
  return leadersCollection()
    .where("active", "==", true)
    .orderBy("order", "asc")
    .get()
    .then((snap) => snap.docs.map((doc) => doc.data()));
}

export function getPublishedMessages(limit?: number): Promise<Message[]> {
  let query = messagesCollection().where("published", "==", true).orderBy("date", "desc");
  if (limit) query = query.limit(limit);
  return query.get().then((snap) => snap.docs.map((doc) => doc.data()));
}

export function getSocialLinks(): Promise<SocialLink[]> {
  return socialLinksCollection()
    .orderBy("order", "asc")
    .get()
    .then((snap) => snap.docs.map((doc) => doc.data()));
}

export function getServices(): Promise<Service[]> {
  return servicesCollection()
    .orderBy("weekday", "asc")
    .orderBy("order", "asc")
    .get()
    .then((snap) => snap.docs.map((doc) => doc.data()));
}

/**
 * `cache()` faz o dedupe por requisição: o layout público, a home e páginas
 * como `/sobre` chamam `getUnitInfo()` de forma independente, mas dentro do
 * mesmo request React só executa a leitura no Firestore uma vez.
 */
export const getUnitInfo = cache(async (): Promise<UnitInfo> => {
  const ref = unitInfoDoc();
  const snap = await ref.get();
  if (snap.exists) return snap.data()!;

  const initial = { ...UNIT_INFO_DEFAULTS, updatedAt: new Date() };
  await ref.set(initial);
  return initial;
});
