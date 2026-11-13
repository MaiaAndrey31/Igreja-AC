import type { Metadata } from "next";
import { getAllEvents, getAllForms } from "@/lib/adminData";
import { EventManager } from "@/components/admin/events/EventManager";

export const metadata: Metadata = { title: "Eventos · Admin" };

/**
 * DTO mínimo de formulário para o seletor de vinculação em eventos.
 * Evita passar o objeto DynamicForm completo (que contém availability com
 * Firestore Timestamps em opensAt/closesAt/activatedAt) para o Client
 * Component, causando erro de serialização no Next.js App Router.
 */
type EventFormOption = {
  id: string;
  title: string;
  submissionCount: number;
};

export default async function AdminEventsPage() {
  const [events, allForms] = await Promise.all([getAllEvents(), getAllForms()]);

  // Serializa apenas os campos necessários — sem Timestamps nem objetos aninhados
  const formOptions: EventFormOption[] = allForms.map((f) => ({
    id: f.id,
    title: f.title,
    submissionCount: f.submissionCount,
  }));

  return <EventManager items={events} forms={formOptions} />;
}