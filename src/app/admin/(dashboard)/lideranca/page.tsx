import type { Metadata } from "next";
import { getAllLeaders } from "@/lib/adminData";
import { LeaderManager } from "@/components/admin/leaders/LeaderManager";

export const metadata: Metadata = { title: "Liderança · Admin" };

export default async function AdminLeadersPage() {
  const leaders = await getAllLeaders();
  return <LeaderManager items={leaders} />;
}
