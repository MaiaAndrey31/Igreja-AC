import type { Metadata } from "next";
import { getAllSocialLinks } from "@/lib/adminData";
import { SocialLinkManager } from "@/components/admin/socialLinks/SocialLinkManager";

export const metadata: Metadata = { title: "Redes sociais · Admin" };

export default async function AdminSocialLinksPage() {
  const links = await getAllSocialLinks();
  return <SocialLinkManager items={links} />;
}
