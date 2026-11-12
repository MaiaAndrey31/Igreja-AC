"use client";

import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CELL_REGIONS, type CellRegion } from "@/lib/celulas/regions";

export interface CellMapMarker {
 id: string;
 name: string;
 region: CellRegion | null;
 neighborhood: string;
 address: string;
 dayTime: string;
 profile: string | null;
 latitude: number;
 longitude: number;
 addressPublic: boolean;
 locationPublic: boolean;
 whatsapp: string;
}

interface CellMapProps {
 markers: CellMapMarker[];
 center: [number, number];
 zoom: number;
 selectedCellId: string | null;
 onSelectCell: (id: string) => void;
 className?: string;
}

/**
 * Mapa interativo de células usando Leaflet diretamente (sem react-leaflet)
 * para evitar problemas de SSR/hidratação no Next.js App Router.
 *
 * Usa tiles do OpenStreetMap (gratuitos, sem API key).
 * Marcadores coloridos por região usando SVG inline como ícone.
 */
export function CellMap({
 markers,
 center,
 zoom,
 selectedCellId,
 onSelectCell,
 className = "",
}: CellMapProps) {
 const mapRef = useRef<L.Map | null>(null);
 const containerRef = useRef<HTMLDivElement>(null);
 const markersLayerRef = useRef<L.LayerGroup | null>(null);

 // Inicializa o mapa uma única vez
 useEffect(() => {
 if (!containerRef.current || mapRef.current) return;

 const map = L.map(containerRef.current, {
 center,
 zoom,
 zoomControl: true,
 attributionControl: true,
 });

 L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
 attribution:
 '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
 maxZoom: 19,
 }).addTo(map);

 markersLayerRef.current = L.layerGroup().addTo(map);
 mapRef.current = map;

 return () => {
 map.remove();
 mapRef.current = null;
 markersLayerRef.current = null;
 };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 // Atualiza centro e zoom quando a cidade muda
 useEffect(() => {
 if (!mapRef.current) return;
 mapRef.current.setView(center, zoom, { animate: true });
 }, [center, zoom]);

 // Cria ícone SVG colorido por região
 const createIcon = useMemo(() => {
 return (region: CellRegion | null, isSelected: boolean) => {
 const color = region ? CELL_REGIONS[region].color : "#6b7280";
 const size = isSelected ? 40 : 30;
 const svg = `
 <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${isSelected ? "#fff" : "#1a1a1a"}" stroke-width="${isSelected ? 2 : 1.5}">
 <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
 </svg>`;

 return L.divIcon({
 html: svg,
 className: "cell-map-marker",
 iconSize: [size, size],
 iconAnchor: [size / 2, size],
 popupAnchor: [0, -size + 4],
 });
 };
 }, []);

 // Atualiza marcadores quando os dados mudam
 useEffect(() => {
 if (!mapRef.current || !markersLayerRef.current) return;

 markersLayerRef.current.clearLayers();

 for (const marker of markers) {
 const isSelected = marker.id === selectedCellId;
 const icon = createIcon(marker.region, isSelected);

 const leafletMarker = L.marker([marker.latitude, marker.longitude], {
 icon,
 }) as L.Marker;

 // Popup content
 const addressLine =
 marker.addressPublic && marker.address
 ? `<p class="text-xs text-gray-600 mt-1">${marker.address}</p>`
 : "";

 const popupContent = `
 <div style="min-width:180px;font-family:system-ui,sans-serif;">
 <p style="font-weight:700;font-size:14px;margin:0;color:#14120f;">${marker.name}</p>
 ${marker.profile ? `<p style="font-size:11px;color:#6b7280;margin:2px 0 0;text-transform:uppercase;letter-spacing:0.05em;">${marker.profile}</p>` : ""}
 <p style="font-size:12px;color:#374151;margin:4px 0 0;">📅 ${marker.dayTime}</p>
 <p style="font-size:12px;color:#374151;margin:2px 0 0;">📍 ${marker.neighborhood}</p>
 ${addressLine}
 </div>`;

 leafletMarker.bindPopup(popupContent, { maxWidth: 260 });

 leafletMarker.on("click", () => {
 onSelectCell(marker.id);
 });

 markersLayerRef.current.addLayer(leafletMarker);
 }

 // Ajusta bounds se houver marcadores
 if (markers.length > 0) {
 const bounds = L.latLngBounds(markers.map((m) => [m.latitude, m.longitude]));
 mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
 }
 }, [markers, selectedCellId, createIcon, onSelectCell]);

 return (
 <div
 ref={containerRef}
 className={`h-[400px] w-full rounded-xl border border-border-subtle sm:h-[500px] ${className}`}
 />
 );
}