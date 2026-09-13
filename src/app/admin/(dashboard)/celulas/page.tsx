import type { Metadata } from "next";
import { getAllCells } from "@/lib/adminData";
import { CellManager } from "@/components/admin/cells/CellManager";

export const metadata: Metadata = { title: "Células · Admin" };

export default async function AdminCellsPage() {
  const cells = await getAllCells();
  return <CellManager items={cells} />;
}
