import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { CellLocator, type CellLocatorData } from "@/components/celulas/CellLocator";
import { getActiveCells, getUnitInfo } from "@/lib/data";

export const metadata: Metadata = {
  title: "Células",
  description:
    "Encontre uma célula perto de você. Escolha sua cidade e encontre um grupo para participar, criar conexões e crescer na fé.",
  alternates: { canonical: "/celulas" },
};

// Conteúdo editado pelo painel admin precisa aparecer em tempo real.
export const dynamic = "force-dynamic";

export default async function CelulasPage() {
  const [cells, unit] = await Promise.all([getActiveCells(), getUnitInfo()]);

  // Mapeia os dados do Firestore para o formato esperado pelo CellLocator
  const locatorData: CellLocatorData[] = cells.map((cell) => ({
    id: cell.id,
    name: cell.name,
    leaderName: cell.leaderName,
    neighborhood: cell.neighborhood,
    address: cell.address,
    dayTime: cell.dayTime,
    whatsapp: cell.whatsapp,
    logoUrl: cell.logoUrl,
    region: cell.region,
    profile: cell.profile,
    city: cell.city,
    citySlug: cell.citySlug,
    meetingDay: cell.meetingDay,
    meetingTime: cell.meetingTime,
    latitude: cell.latitude,
    longitude: cell.longitude,
    addressPublic: cell.addressPublic,
    locationPublic: cell.locationPublic,
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Fora do domingo"
        title="Encontre uma célula perto de você"
        description="Escolha sua cidade e encontre uma célula para participar, criar conexões e crescer na fé."
        meta={cells.length > 0 ? `${cells.length} células cadastradas` : undefined}
      />
      <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 sm:pb-32">
        <Suspense
          fallback={
            <div className="flex h-[400px] items-center justify-center rounded-xl border border-border-subtle bg-surface text-sm text-foreground-subtle">
              Carregando localizador de células...
            </div>
          }
        >
          <CellLocator cells={locatorData} />
        </Suspense>
      </div>
    </div>
  );
}