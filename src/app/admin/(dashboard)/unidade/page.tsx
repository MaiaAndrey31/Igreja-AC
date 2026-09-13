import type { Metadata } from "next";
import { getUnitInfo } from "@/lib/data";
import { UnitInfoForm } from "@/components/admin/unit/UnitInfoForm";

export const metadata: Metadata = { title: "Unidade · Admin" };

export default async function AdminUnitPage() {
  const unit = await getUnitInfo();

  return (
    <div>
      <h1 className="font-display text-2xl tracking-wide text-foreground">Dados da unidade</h1>
      <p className="mt-2 text-sm text-foreground-subtle">
        Identidade, história e contato exibidos na home, em /sobre e nas páginas jurídicas.
      </p>
      <div className="mt-8">
        <UnitInfoForm unit={unit} />
      </div>
    </div>
  );
}
