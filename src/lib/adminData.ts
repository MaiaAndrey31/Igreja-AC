import "server-only";
import {
  announcementsCollection,
  cellsCollection,
  formSubmissionsCollection,
  formsCollection,
  formSubmissionsDynCollection,
  galleryCollection,
  leadersCollection,
  messagesCollection,
  ministriesCollection,
  servicesCollection,
  socialLinksCollection,
  type Announcement,
  type Cell,
  type DynamicForm,
  type DynamicFormSubmission,
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

// ---------------------------------------------------------------------------
// DynamicForm — leituras administrativas
// ---------------------------------------------------------------------------

export function getAllForms(): Promise<DynamicForm[]> {
  return formsCollection()
    .orderBy("updatedAt", "desc")
    .get()
    .then((snap) => snap.docs.map((doc) => doc.data()));
}

export async function getFormById(id: string): Promise<DynamicForm | null> {
  const snap = await formsCollection().doc(id).get();
  if (!snap.exists) return null;
  return snap.data()!;
}

export function getFormSubmissions(formId: string): Promise<DynamicFormSubmission[]> {
  return formSubmissionsDynCollection(formId)
    .orderBy("createdAt", "desc")
    .get()
    .then((snap) => snap.docs.map((doc) => doc.data()));
}

export interface FormAdminCounts {
  total: number;
  active: number;
  closed: number;
  totalSubmissions: number;
}

export async function getFormAdminCounts(): Promise<FormAdminCounts> {
  const all = await getAllForms();
  const now = new Date();

  let active = 0;
  let closed = 0;
  let totalSubmissions = 0;

  for (const form of all) {
    totalSubmissions += form.submissionCount;
    if (form.adminStatus === "published") {
      // Usa a lógica de disponibilidade para determinar se está ativo
      const { computeEffectiveStatus } = await import("@/lib/forms/availability");
      const status = computeEffectiveStatus(
        {
          adminStatus: form.adminStatus,
          availability: form.availability,
          submissionCount: form.submissionCount,
          maxSubmissions: form.maxSubmissions,
        },
        now
      );
      if (status === "open") active++;
      else closed++;
    }
  }

  return { total: all.length, active, closed, totalSubmissions };
}
