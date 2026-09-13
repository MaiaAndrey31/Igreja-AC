import type { Metadata } from "next";
import { getAllFormSubmissions } from "@/lib/adminData";
import { SubmissionsInbox } from "@/components/admin/submissions/SubmissionsInbox";

export const metadata: Metadata = { title: "Contatos · Admin" };

export default async function AdminContatosPage() {
  const submissions = await getAllFormSubmissions();
  return <SubmissionsInbox items={submissions} />;
}
