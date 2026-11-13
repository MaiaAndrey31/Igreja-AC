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

// ---------------------------------------------------------------------------
// DynamicForm — formulário público por slug
// ---------------------------------------------------------------------------

import { formsCollection, type DynamicForm } from "@/lib/firebase/collections";

/**
 * Busca um formulário publicado pelo slug. Retorna null se não existir ou se
 * estiver em rascunho/arquivado. A disponibilidade efetiva é calculada pelo
 * caller via `computeEffectiveStatus` (src/lib/forms/availability.ts).
 */
export async function getPublishedFormBySlug(slug: string): Promise<DynamicForm | null> {
  const snap = await formsCollection()
    .where("slug", "==", slug)
    .where("adminStatus", "==", "published")
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0].data();
}

// ---------------------------------------------------------------------------
// Events — eventos públicos (coleção announcements com campos estendidos)
// ---------------------------------------------------------------------------

/**
 * DTO público de pop-up — apenas os campos necessários para renderização.
 * Evita enviar dados administrativos (formId, maxSubmissions, etc.) ao cliente.
 */
export interface PopupAnnouncement {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  popupButtonText: string | null;
  popupButtonUrl: string | null;
  startDate: Date;
  endDate: Date | null;
  popupPriority: number;
  popupFrequency: "session" | "lifetime" | "visit";
}

/**
 * Lista avisos elegíveis para exibição como pop-up na home.
 * Filtra por showAsPopup === true, published === true e período de vigência.
 * Ordena por prioridade decrescente (maior valor = maior prioridade).
 * Retorna DTO público sem campos administrativos sensíveis.
 */
export async function getEligiblePopups(): Promise<PopupAnnouncement[]> {
  const now = new Date();
  const snap = await announcementsCollection()
    .where("showAsPopup", "==", true)
    .where("published", "==", true)
    .orderBy("popupPriority", "desc")
    .get();

  return snap.docs
    .map((doc) => doc.data())
    .filter((a) => {
      // Vigência: startDate <= now && (endDate == null || endDate >= now)
      if (a.startDate > now) return false;
      if (a.endDate && a.endDate < now) return false;
      return true;
    })
    .map((a): PopupAnnouncement => ({
      id: a.id,
      title: a.title,
      description: a.description,
      imageUrl: a.imageUrl ?? null,
      popupButtonText: a.popupButtonText ?? null,
      popupButtonUrl: a.popupButtonUrl ?? null,
      startDate: a.startDate,
      endDate: a.endDate ?? null,
      popupPriority: a.popupPriority ?? 0,
      popupFrequency: (a.popupFrequency as PopupAnnouncement["popupFrequency"]) ?? "session",
    }));
}

/**
 * Lista apenas eventos publicados (type === "event"), ordenados por data.
 * Avisos comuns (sem campo type ou type !== "event") são excluídos.
 */
export function getPublishedEvents(): Promise<Announcement[]> {
  return announcementsCollection()
    .where("type", "==", "event")
    .where("published", "==", true)
    .orderBy("startDate", "asc")
    .get()
    .then((snap) => snap.docs.map((doc) => doc.data()));
}

/**
 * Lista eventos destacados e publicados para exibição na home.
 * Filtra por `type == "event"`, `featured == true` e `published == true`.
 * Retorna array vazio quando não há eventos elegíveis (a seção não aparece).
 */
export function getPublishedFeaturedEvents(): Promise<Announcement[]> {
  return announcementsCollection()
    .where("type", "==", "event")
    .where("featured", "==", true)
    .where("published", "==", true)
    .orderBy("startDate", "asc")
    .get()
    .then((snap) => snap.docs.map((doc) => doc.data()));
}

/**
 * Busca um evento publicado pelo slug. Retorna null se não existir ou se
 * estiver despublicado.
 */
export async function getPublishedEventBySlug(slug: string): Promise<Announcement | null> {
  const snap = await announcementsCollection()
    .where("slug", "==", slug)
    .where("published", "==", true)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0].data();
}

/**
 * Lista eventos em destaque para a home (featured + published).
 */
export function getFeaturedEvents(): Promise<Announcement[]> {
  return announcementsCollection()
    .where("published", "==", true)
    .where("featured", "==", true)
    .orderBy("startDate", "asc")
    .get()
    .then((snap) => snap.docs.map((doc) => doc.data()));
}
