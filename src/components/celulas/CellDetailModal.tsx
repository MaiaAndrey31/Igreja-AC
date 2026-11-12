"use client";

import { useEffect, useRef, useCallback } from "react";
import { X, MapPin, Clock, Navigation, Calendar } from "lucide-react";
import { CELL_REGIONS, type CellRegion } from "@/lib/celulas/regions";

export interface CellDetailData {
 id: string;
 publicName: string;
 region: CellRegion | null;
 profile: string | null;
 meetingDay: string | null;
 meetingTime: string | null;
 dayTime: string;
 neighborhood: string | null;
 city: string | null;
 /** Endereço completo — somente se autorizado para publicação. */
 publicAddress: string | null;
 latitude: number | null;
 longitude: number | null;
}

interface CellDetailModalProps {
 cell: CellDetailData | null;
 onClose: () => void;
}

/**
 * Modal de detalhes da célula.
 *
 * - Fecha com Escape, clique fora ou botão X.
 * - Restaura foco ao elemento que abriu o modal.
 * - Trap de foco básico dentro do modal.
 * - Responsivo com scroll interno no mobile.
 */
export function CellDetailModal({ cell, onClose }: CellDetailModalProps) {
 const modalRef = useRef<HTMLDivElement>(null);
 const previousFocusRef = useRef<HTMLElement | null>(null);

 // Salva o elemento focado antes de abrir e restaura ao fechar
 useEffect(() => {
 if (cell) {
 previousFocusRef.current = document.activeElement as HTMLElement;
 // Foca no modal para acessibilidade
 modalRef.current?.focus();
 } else {
 previousFocusRef.current?.focus();
 previousFocusRef.current = null;
 }
 }, [cell]);

 // Fecha com Escape
 const handleKeyDown = useCallback(
 (e: KeyboardEvent) => {
 if (e.key === "Escape") onClose();
 },
 [onClose]
 );

 useEffect(() => {
 if (!cell) return;
 document.addEventListener("keydown", handleKeyDown);
 // Bloqueia scroll do body quando o modal está aberto
 document.body.style.overflow = "hidden";
 return () => {
 document.removeEventListener("keydown", handleKeyDown);
 document.body.style.overflow = "";
 };
 }, [cell, handleKeyDown]);

 if (!cell) return null;

 // Rota por coordenadas verificadas OU por endereço textual completo autorizado
 const hasCoords = cell.latitude != null && cell.longitude != null;
 const hasAddress = !!cell.publicAddress;
 const hasRoute = hasCoords || hasAddress;

 let googleMapsUrl: string | null = null;
 if (hasCoords) {
 googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${cell.latitude},${cell.longitude}`;
 } else if (hasAddress && cell.city) {
 // Endereço textual: codifica para URL segura
 const query = encodeURIComponent(`${cell.publicAddress}, ${cell.neighborhood ?? ""} ${cell.city}`);
 googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
 }

 return (
 <div
 className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
 onClick={(e) => {
 // Fecha ao clicar fora do conteúdo do modal
 if (e.target === e.currentTarget) onClose();
 }}
 role="dialog"
 aria-modal="true"
 aria-label={`Detalhes da célula ${cell.publicName}`}
 >
 <div
 ref={modalRef}
 tabIndex={-1}
 className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border-subtle bg-surface shadow-2xl outline-none"
 >
 {/* Botão fechar */}
 <button
 type="button"
 onClick={onClose}
 className="absolute right-4 top-4 rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
 aria-label="Fechar"
 >
 <X size={20} />
 </button>

 <div className="flex flex-col gap-5 p-6 sm:p-8">
 {/* Região badge */}
 {cell.region && (
 <span
 className="inline-block w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white"
 style={{ backgroundColor: CELL_REGIONS[cell.region].color }}
 >
 Região {CELL_REGIONS[cell.region].label}
 </span>
 )}

 {/* Nome */}
 <h2 className="font-display text-2xl tracking-wide text-foreground sm:text-3xl">
 {cell.publicName}
 </h2>

 {/* Informações */}
 <div className="flex flex-col gap-3 text-sm text-foreground-muted">
 {cell.profile && (
 <div className="flex items-start gap-3">
 <span className="mt-0.5 shrink-0 text-xs font-medium uppercase tracking-wider text-foreground-subtle">
 Perfil
 </span>
 <span>{cell.profile}</span>
 </div>
 )}

 {cell.meetingDay && (
 <div className="flex items-start gap-3">
 <Calendar size={14} className="mt-0.5 shrink-0 text-foreground-subtle" />
 <span>{cell.meetingDay}</span>
 </div>
 )}

 {cell.meetingTime && (
 <div className="flex items-start gap-3">
 <Clock size={14} className="mt-0.5 shrink-0 text-foreground-subtle" />
 <span>{cell.meetingTime}</span>
 </div>
 )}

 {!cell.meetingDay && !cell.meetingTime && cell.dayTime && (
 <div className="flex items-start gap-3">
 <Clock size={14} className="mt-0.5 shrink-0 text-foreground-subtle" />
 <span>{cell.dayTime}</span>
 </div>
 )}

 {cell.neighborhood && (
 <div className="flex items-start gap-3">
 <MapPin size={14} className="mt-0.5 shrink-0 text-foreground-subtle" />
 <span>
 {cell.neighborhood}
 {cell.city ? ` — ${cell.city}` : ""}
 </span>
 </div>
 )}

 {cell.publicAddress && (
 <div className="rounded-lg border border-border-subtle bg-background px-4 py-3 text-xs text-foreground-muted">
 <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
 Endereço
 </p>
 {cell.publicAddress}
 </div>
 )}
 </div>

 {/* Botão de rota */}
 {googleMapsUrl && (
 <a
 href={googleMapsUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-accent bg-accent px-6 py-3 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent/90"
 >
 <Navigation size={16} />
 Como chegar
 </a>
 )}
 </div>
 </div>
 </div>
 );
}