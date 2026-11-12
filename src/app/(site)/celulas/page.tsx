import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { CellLocator, type CellLocatorData } from "@/components/celulas/CellLocator";
import { getActiveCells } from "@/lib/data";

export const metadata: Metadata = {
 title: "Células",
 description:
 "Encontre uma célula perto de você. Escolha sua cidade e encontre um grupo para participar, criar conexões e crescer na fé.",
 alternates: { canonical: "/celulas" },
};

// Conteúdo editado pelo painel admin precisa aparecer em tempo real.
export const dynamic = "force-dynamic";

/**
 * Gera o nome público da célula removendo nomes de líderes entre parênteses.
 *
 * Exemplos:
 * - "Eis Me Aqui XIII (Daiane e Nete)" → "Eis Me Aqui XIII"
 * - "Beréia IX (Marcos Camilo)" → "Beréia IX"
 * - "Resgate (Pacaembu)" → "Resgate"
 * - "A serviço do Rei (Min Silvia)" → "A serviço do Rei"
 *
 * Preserva parênteses que NÃO contêm nomes próprios (ex.: siglas ou
 * descrições genéricas). A heurística remove qualquer conteúdo entre
 * parênteses no final do nome — o admin pode ajustar via campo publicName
 * no painel se necessário.
 */
function derivePublicName(name: string): string {
 // Remove sufixo entre parênteses no final do nome
 return name.replace(/\s*\([^)]*\)\s*$/, "").trim() || name;
}

/**
 * Serializa os dados da célula para o payload público.
 *
 * SEGURANÇA: leaderName, whatsapp, logoUrl, sourceId e outros campos
 * administrativos NÃO são enviados ao navegador. O endereço completo só é
 * incluído quando addressPublic === true.
 */
function toPublicCell(cell: {
 id: string;
 name: string;
 leaderName: string;
 neighborhood: string;
 address: string;
 dayTime: string;
 whatsapp: string;
 logoUrl: string | null;
 region: string | null;
 profile: string | null;
 city: string | null;
 citySlug: string | null;
 meetingDay: string | null;
 meetingTime: string | null;
 latitude: number | null;
 longitude: number | null;
 addressPublic: boolean;
 locationPublic: boolean;
}): CellLocatorData {
 return {
 id: cell.id,
 publicName: derivePublicName(cell.name),
 neighborhood: cell.neighborhood,
 // Endereço completo SOMENTE se autorizado para publicação
 publicAddress: cell.addressPublic ? cell.address : null,
 dayTime: cell.dayTime,
 region: cell.region as CellLocatorData["region"],
 profile: cell.profile,
 city: cell.city,
 citySlug: cell.citySlug,
 meetingDay: cell.meetingDay,
 meetingTime: cell.meetingTime,
 latitude: cell.locationPublic ? cell.latitude : null,
 longitude: cell.locationPublic ? cell.longitude : null,
 };
}

export default async function CelulasPage() {
 const cells = await getActiveCells();

 // Serializa APENAS dados públicos — leaderName e campos administrativos
 // NUNCA chegam ao navegador.
 const locatorData: CellLocatorData[] = cells.map(toPublicCell);

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