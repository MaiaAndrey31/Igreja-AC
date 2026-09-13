import type { Metadata } from "next";
import { getAllGalleryImages } from "@/lib/adminData";
import { GalleryManager } from "@/components/admin/gallery/GalleryManager";

export const metadata: Metadata = { title: "Galeria · Admin" };

export default async function AdminGalleryPage() {
  const images = await getAllGalleryImages();
  return <GalleryManager items={images} />;
}
