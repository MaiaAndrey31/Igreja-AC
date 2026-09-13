import type { Metadata } from "next";
import { getAllServices } from "@/lib/adminData";
import { ServiceManager } from "@/components/admin/services/ServiceManager";

export const metadata: Metadata = { title: "Horários · Admin" };

export default async function AdminServicesPage() {
  const services = await getAllServices();
  return <ServiceManager items={services} />;
}
