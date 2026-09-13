import "server-only";
import {
  announcementsCollection,
  cellsCollection,
  formSubmissionsCollection,
  galleryCollection,
  leadersCollection,
  messagesCollection,
  ministriesCollection,
  servicesCollection,
  socialLinksCollection,
  type Announcement,
  type Cell,
  type FormSubmission,
  type GalleryImage,
  type Leader,
  type Message,
  type Ministry,
  type Service,
  type SocialLink,
} from "@/lib/firebase/collections";

/**
 * Leituras usadas só pelo painel `/admin` — sem os filtros `published`/`active`
 * das leituras públicas em `src/lib/data.ts`, porque quem administra precisa
 * ver rascunhos e itens desativados também.
 */

export function getAllMinistries(): Promise<Ministry[]> {
  return ministriesCollection()
    .orderBy("order", "asc")
    .get()
    .then((snap) => snap.docs.map((doc) => doc.data()));
}

export function getAllCells(): Promise<Cell[]> {
  return cellsCollection()
    .orderBy("neighborhood", "asc")
    .orderBy("order", "asc")
    .get()
    .then((snap) => snap.docs.map((doc) => doc.data()));
}

export function getAllAnnouncements(): Promise<Announcement[]> {
  return announcementsCollection()
    .orderBy("startDate", "asc")
    .get()
    .then((snap) => snap.docs.map((doc) => doc.data()));
}

export function getAllGalleryImages(): Promise<GalleryImage[]> {
  return galleryCollection()
    .orderBy("order", "asc")
    .orderBy("createdAt", "desc")
    .get()
    .then((snap) => snap.docs.map((doc) => doc.data()));
}

export function getAllLeaders(): Promise<Leader[]> {
  return leadersCollection()
    .orderBy("order", "asc")
    .get()
    .then((snap) => snap.docs.map((doc) => doc.data()));
}

export function getAllMessages(): Promise<Message[]> {
  return messagesCollection()
    .orderBy("date", "desc")
    .get()
    .then((snap) => snap.docs.map((doc) => doc.data()));
}

export function getAllSocialLinks(): Promise<SocialLink[]> {
  return socialLinksCollection()
    .orderBy("order", "asc")
    .get()
    .then((snap) => snap.docs.map((doc) => doc.data()));
}

export function getAllServices(): Promise<Service[]> {
  return servicesCollection()
    .orderBy("weekday", "asc")
    .orderBy("order", "asc")
    .get()
    .then((snap) => snap.docs.map((doc) => doc.data()));
}

export function getAllFormSubmissions(): Promise<FormSubmission[]> {
  return formSubmissionsCollection()
    .orderBy("createdAt", "desc")
    .get()
    .then((snap) => snap.docs.map((doc) => doc.data()));
}

export interface AdminCounts {
  ministries: number;
  cells: number;
  announcements: number;
  gallery: number;
  unreadSubmissions: number;
}

export async function getAdminCounts(): Promise<AdminCounts> {
  const [ministries, cells, announcements, gallery, unreadSubmissions] = await Promise.all([
    ministriesCollection().count().get(),
    cellsCollection().count().get(),
    announcementsCollection().count().get(),
    galleryCollection().count().get(),
    formSubmissionsCollection().where("status", "==", "novo").count().get(),
  ]);

  return {
    ministries: ministries.data().count,
    cells: cells.data().count,
    announcements: announcements.data().count,
    gallery: gallery.data().count,
    unreadSubmissions: unreadSubmissions.data().count,
  };
}
