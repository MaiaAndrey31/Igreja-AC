"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, MapPin, Clock, Navigation, Filter, X } from "lucide-react";
import { CellMap, type CellMapMarker } from "@/components/celulas/CellMap";
import { CELL_REGIONS, type CellRegion } from "@/lib/celulas/regions";

export interface CellLocatorData {
 id: string;
 name: string;
 leaderName: string;
 neighborhood: string;
 address: string;
 dayTime: string;
 whatsapp: string;
 logoUrl: string | null;
 region: CellRegion | null;
 profile: string | null;
 city: string | null;
 citySlug: string | null;
 meetingDay: string | null;
 meetingTime: string | null;
 latitude: number | null;
 longitude: number | null;
 addressPublic: boolean;
 locationPublic: boolean;
}

interface CityOption {
 slug: string;
 name: string;
 count: number;
}

// Centros geográficos aproximados das cidades (usados apenas para posicionar o mapa)
const CITY_CENTERS: Record<string, [number, number]> = {
 adamantina: [-21.6833, -51.0733],
 "florida-paulista": [-21.6133, -51.1750],
 lucelia: [-21.6833, -50.9833],
 mariapolis: [-21.7333, -51.1833],
 "inubia-paulista": [-21.7500, -51.0000],
 pacaembu: [-21.6500, -51.2500],
 "sao-paulo": [-23.5505, -46.6333],
};

const DEFAULT_CITY = "adamantina";

export function CellLocator({ cells }: { cells: CellLocatorData[] }) {
 const searchParams = useSearchParams();
 const router = useRouter();

 // Cidade inicial da URL ou padrão
 const initialCity = searchParams.get("cidade") || DEFAULT_CITY;
 const [selectedCity, setSelectedCity] = useState(initialCity);
 const [selectedRegion, setSelectedRegion] = useState<CellRegion | "all">("all");
 const [selectedProfile, setSelectedProfile] = useState<string>("all");
 const [selectedDay, setSelectedDay] = useState<string>("all");
 const [searchText, setSearchText] = useState("");
 const [selectedCellId, setSelectedCellId] = useState<string | null>(null);

 // Cidades disponíveis derivadas dos dados
 const cities: CityOption[] = useMemo(() => {
 const map = new Map<string, { name: string; count: number }>();
 for (const cell of cells) {
 if (!cell.citySlug || !cell.city) continue;
 const existing = map.get(cell.citySlug);
 if (existing) {
 existing.count++;
 } else {
 map.set(cell.citySlug, { name: cell.city, count: 1 });
 }
 }
 return Array.from(map.entries())
 .map(([slug, data]) => ({ slug, ...data }))
 .sort((a, b) => a.name.localeCompare(b.name));
 }, [cells]);

 // Filtra células pela cidade selecionada + filtros secundários
 const filteredCells = useMemo(() => {
 return cells.filter((cell) => {
 if (cell.citySlug !== selectedCity) return false;
 if (selectedRegion !== "all" && cell.region !== selectedRegion) return false;
 if (selectedProfile !== "all" && cell.profile !== selectedProfile) return false;
 if (selectedDay !== "all" && cell.meetingDay !== selectedDay) return false;
 if (searchText) {
 const lower = searchText.toLowerCase();
 const matchesName = cell.name.toLowerCase().includes(lower);
 const matchesNeighborhood = cell.neighborhood?.toLowerCase().includes(lower);
 const matchesLeader = cell.leaderName?.toLowerCase().includes(lower);
 if (!matchesName && !matchesNeighborhood && !matchesLeader) return false;
 }
 return true;
 });
 }, [cells, selectedCity, selectedRegion, selectedProfile, selectedDay, searchText]);

 // Marcadores para o mapa (apenas células com coordenadas verificadas e localização pública)
 const mapMarkers: CellMapMarker[] = useMemo(() => {
 return filteredCells
 .filter((c) => c.latitude != null && c.longitude != null && c.locationPublic)
 .map((c) => ({
 id: c.id,
 name: c.name,
 region: c.region,
 neighborhood: c.neighborhood,
 address: c.address,
 dayTime: c.dayTime,
 profile: c.profile,
 latitude: c.latitude!,
 longitude: c.longitude!,
 addressPublic: c.addressPublic,
 locationPublic: c.locationPublic,
 whatsapp: c.whatsapp,
 }));
 }, [filteredCells]);

 // Perfis únicos da cidade selecionada
 const profiles = useMemo(() => {
 const set = new Set<string>();
 for (const cell of cells) {
 if (cell.citySlug === selectedCity && cell.profile) set.add(cell.profile);
 }
 return Array.from(set).sort();
 }, [cells, selectedCity]);

 // Dias únicos da cidade selecionada
 const days = useMemo(() => {
 const order = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
 const set = new Set<string>();
 for (const cell of cells) {
 if (cell.citySlug === selectedCity && cell.meetingDay) set.add(cell.meetingDay);
 }
 return order.filter((d) => set.has(d));
 }, [cells, selectedCity]);

 // Centro do mapa para a cidade selecionada
 const mapCenter: [number, number] = CITY_CENTERS[selectedCity] || CITY_CENTERS[DEFAULT_CITY];

 // Troca de cidade atualiza URL sem reload
 const handleCityChange = useCallback(
 (slug: string) => {
 setSelectedCity(slug);
 setSelectedCellId(null);
 setSelectedRegion("all");
 setSelectedProfile("all");
 setSelectedDay("all");
 setSearchText("");
 router.push(`/celulas?cidade=${slug}`, { scroll: false });
 },
 [router]
 );

 const handleSelectCell = useCallback((id: string) => {
 setSelectedCellId(id);
 // Scroll suave até o card na lista
 const el = document.getElementById(`cell-card-${id}`);
 if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
 }, []);

 const clearFilters = () => {
 setSelectedRegion("all");
 setSelectedProfile("all");
 setSelectedDay("all");
 setSearchText("");
 };

 const hasActiveFilters =
 selectedRegion !== "all" || selectedProfile !== "all" || selectedDay !== "all" || searchText !== "";

 return (
 <div className="flex flex-col gap-8">
 {/* Seletor de cidades */}
 <section className="flex flex-col gap-4">
 <label className="text-xs font-medium uppercase tracking-[0.15em] text-foreground-subtle">
 Selecione sua cidade
 </label>
 <div className="flex flex-wrap gap-2">
 {cities.map((city) => (
 <button
 key={city.slug}
 type="button"
 onClick={() => handleCityChange(city.slug)}
 className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.1em] transition-colors ${
 selectedCity === city.slug
 ? "border-accent bg-accent text-accent-contrast"
 : "border-border-soft text-foreground-subtle hover:border-accent hover:text-foreground"
 }`}
 >
 {city.name} ({city.count})
 </button>
 ))}
 </div>
 </section>

 {/* Filtros secundários */}
 <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5">
 <div className="flex items-center justify-between">
 <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
 <Filter size={14} />
 Filtros
 </h3>
 {hasActiveFilters && (
 <button
 type="button"
 onClick={clearFilters}
 className="flex items-center gap-1 text-xs text-foreground-subtle transition-colors hover:text-accent"
 >
 <X size={12} />
 Limpar filtros
 </button>
 )}
 </div>

 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
 {/* Busca */}
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle" size={14} />
 <input
 type="text"
 placeholder="Buscar por nome, bairro..."
 value={searchText}
 onChange={(e) => setSearchText(e.target.value)}
 className="w-full rounded-lg border border-border-subtle bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none"
 />
 </div>

 {/* Região */}
 <select
 value={selectedRegion}
 onChange={(e) => setSelectedRegion(e.target.value as CellRegion | "all")}
 className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
 >
 <option value="all">Todas as regiões</option>
 {(Object.entries(CELL_REGIONS) as [CellRegion, { label: string }][]).map(([key, val]) => (
 <option key={key} value={key}>
 {val.label}
 </option>
 ))}
 </select>

 {/* Perfil */}
 <select
 value={selectedProfile}
 onChange={(e) => setSelectedProfile(e.target.value)}
 className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
 >
 <option value="all">Todos os perfis</option>
 {profiles.map((p) => (
 <option key={p} value={p}>
 {p}
 </option>
 ))}
 </select>

 {/* Dia */}
 <select
 value={selectedDay}
 onChange={(e) => setSelectedDay(e.target.value)}
 className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
 >
 <option value="all">Todos os dias</option>
 {days.map((d) => (
 <option key={d} value={d}>
 {d}
 </option>
 ))}
 </select>
 </div>

 <p className="text-xs text-foreground-subtle">
 {filteredCells.length} célula{filteredCells.length !== 1 ? "s" : ""} encontrada{filteredCells.length !== 1 ? "s" : ""} em{" "}
 {cities.find((c) => c.slug === selectedCity)?.name ?? selectedCity}
 </p>
 </section>

 {/* Mapa */}
 {mapMarkers.length > 0 ? (
 <CellMap
 markers={mapMarkers}
 center={mapCenter}
 zoom={13}
 selectedCellId={selectedCellId}
 onSelectCell={handleSelectCell}
 />
 ) : (
 <div className="flex h-[300px] items-center justify-center rounded-xl border border-border-subtle bg-surface text-sm text-foreground-subtle">
 Nenhuma célula com localização verificada nesta cidade.
 </div>
 )}

 {/* Legenda de regiões */}
 <div className="flex flex-wrap gap-4">
 {(Object.entries(CELL_REGIONS) as [CellRegion, { label: string; color: string }][]).map(([key, val]) => (
 <div key={key} className="flex items-center gap-2 text-xs text-foreground-muted">
 <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: val.color }} />
 {val.label}
 </div>
 ))}
 </div>

 {/* Lista de cartões */}
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {filteredCells.map((cell) => (
 <div
 key={cell.id}
 id={`cell-card-${cell.id}`}
 onClick={() => handleSelectCell(cell.id)}
 className={`cursor-pointer rounded-xl border p-5 transition-all ${
 selectedCellId === cell.id
 ? "border-accent bg-accent/5 shadow-md"
 : "border-border-subtle bg-surface hover:border-accent/50"
 }`}
 >
 {/* Região badge */}
 {cell.region && (
 <span
 className="mb-3 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
 style={{ backgroundColor: CELL_REGIONS[cell.region].color }}
 >
 {CELL_REGIONS[cell.region].label}
 </span>
 )}

 <h3 className="font-display text-lg tracking-wide text-foreground">{cell.name}</h3>

 {cell.profile && (
 <p className="mt-1 text-[11px] uppercase tracking-wider text-foreground-subtle">{cell.profile}</p>
 )}

 <div className="mt-3 flex flex-col gap-1.5 text-xs text-foreground-muted">
 <span className="flex items-center gap-2">
 <Clock size={12} className="shrink-0 text-foreground-subtle" />
 {cell.dayTime}
 </span>
 <span className="flex items-center gap-2">
 <MapPin size={12} className="shrink-0 text-foreground-subtle" />
 {cell.neighborhood || "Bairro não informado"}
 </span>
 {cell.addressPublic && cell.address && (
 <span className="truncate pl-5 text-foreground-subtle">{cell.address}</span>
 )}
 </div>

 {/* Ações */}
 <div className="mt-4 flex gap-2">
 {cell.latitude != null && cell.longitude != null && cell.locationPublic && (
 <a
 href={`https://www.google.com/maps/dir/?api=1&destination=${cell.latitude},${cell.longitude}`}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border-soft py-2 text-[10px] uppercase tracking-[0.1em] text-foreground transition-colors hover:border-accent hover:text-accent"
 >
 <Navigation size={12} />
 Como chegar
 </a>
 )}
 {cell.whatsapp && (
 <a
 href={`https://wa.me/${cell.whatsapp}?text=${encodeURIComponent(`Olá, vi a célula ${cell.name} no site e gostaria de saber mais.`)}`}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border-soft py-2 text-[10px] uppercase tracking-[0.1em] text-foreground transition-colors hover:border-accent hover:text-accent"
 >
 WhatsApp
 </a>
 )}
 </div>
 </div>
 ))}
 </div>

 {filteredCells.length === 0 && (
 <div className="py-12 text-center text-sm text-foreground-subtle">
 Nenhuma célula encontrada com os filtros selecionados.
 </div>
 )}
 </div>
 );
}