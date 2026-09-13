import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { CellFilterableGrid } from "@/components/celulas/CellFilterableGrid";
import { getActiveCells } from "@/lib/data";

export const metadata: Metadata = {
  title: "Células",
  description:
    "A Amor e Cuidado é uma igreja pastoreada por células. Encontre um grupo perto de você.",
  alternates: { canonical: "/celulas" },
};

// Conteúdo editado pelo painel admin precisa aparecer em tempo real.
export const dynamic = "force-dynamic";

export default async function CelulasPage() {
  const cells = await getActiveCells();

  return (
    <div>
      <PageHeader
        eyebrow="Fora do domingo"
        title="Encontre uma célula"
        description="Tudo acontece através delas. As células se reúnem durante a semana, perto de onde você mora."
        meta={cells.length > 0 ? `${cells.length} células cadastradas` : undefined}
      />
      <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 sm:pb-32">
        <CellFilterableGrid cells={cells} />
      </div>
    </div>
  );
}
