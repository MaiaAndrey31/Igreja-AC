import "server-only";
import {
  announcementsCollection,
  cellsCollection,
  galleryCollection,
  ministriesCollection,
  siteSettingsDoc,
  SITE_SETTINGS_DEFAULTS,
  type Announcement,
  type Cell,
  type GalleryImage,
  type Ministry,
  type SiteSettings,
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
