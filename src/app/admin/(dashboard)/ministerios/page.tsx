import type { Metadata } from "next";
import { getAllMinistries } from "@/lib/adminData";
import { MinistryManager } from "@/components/admin/ministries/MinistryManager";

export const metadata: Metadata = { title: "Ministérios · Admin" };

export default async function AdminMinistriesPage() {
  const ministries = await getAllMinistries();
  return <MinistryManager items={ministries} />;
}
