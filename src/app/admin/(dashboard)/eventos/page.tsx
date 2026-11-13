import type { Metadata } from "next";
import { getAllEvents, getAllForms } from "@/lib/adminData";
import { EventManager } from "@/components/admin/events/EventManager";

export const metadata: Metadata = { title: "Eventos · Admin" };

export default async function AdminEventsPage() {
  const [events, forms] = await Promise.all([getAllEvents(), getAllForms()]);
  return <EventManager items={events} forms={forms} />;
}