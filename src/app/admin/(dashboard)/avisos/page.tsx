import type { Metadata } from "next";
import { getAllAnnouncements } from "@/lib/adminData";
import { AnnouncementManager } from "@/components/admin/announcements/AnnouncementManager";

export const metadata: Metadata = { title: "Avisos · Admin" };

export default async function AdminAnnouncementsPage() {
  const announcements = await getAllAnnouncements();
  return <AnnouncementManager items={announcements} />;
}
