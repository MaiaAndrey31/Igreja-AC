import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, MapPin, ArrowLeft, Users, MessageCircle } from "lucide-react";
import { getFormSlugById, getPublishedEventBySlug, getUnitInfo } from "@/lib/data";
import type { UnitInfo } from "@/lib/firebase/collections";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
 return new Intl.DateTimeFormat("pt-BR", {
 weekday: "long",
 day: "2-digit",
 month: "long",
 year: "numeric",
 }).format(date);
}

function formatTime(date: Date): string {
 return new Intl.DateTimeFormat("pt-BR", {
 hour: "2-digit",
 minute: "2-digit",
 }).format(date);
}

/** Serializa datas para strings ISO seguras (evita erro React #441). */
function serializeDate(value: Date | null | undefined): string | null {
 if (!value) return null;
 return value.toISOString();
}

export async function generateMetadata({
 params,
}: {
 params: Promise<{ slug: string }>;
}): Promise<Metadata> {
 const { slug } = await params;
 const event = await getPublishedEventBySlug(slug);
 if (!event) return { title: "Evento não encontrado" };

 const title = `${event.title} — Eventos`;
 const description = event.description.slice(0, 160);
 const url = `${siteUrl}/eventos/${event.slug}`;
 const imageUrl = event.imageUrl ?? undefined;

 return {
 title,
 description,
 alternates: { canonical: url },
 openGraph: {
 type: "article",
 locale: "pt_BR",
 title,
 description,
 url,
 images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : undefined,
 publishedTime: serializeDate(event.startDate) ?? undefined,
 },
 twitter: {
 card: imageUrl ? "summary_large_image" : "summary",
 title,
 description,
 images: imageUrl ? [imageUrl] : undefined,
 },
 };
}

export default async function EventoPage({
 params,
}: {
 params: Promise<{ slug: string }>;
}) {
 const { slug } = await params;
 const event = await getPublishedEventBySlug(slug);
 if (!event) notFound();

 // Resolve o slug do formulário vinculado para construir a URL correta
 // (/formularios/[slug] em vez de /formularios/[id], que retorna 404)
 const formSlug = event.formId ? await getFormSlugById(event.formId) : null;

 const unit = await getUnitInfo();

 // Schema.org Event
 const jsonLd = {
 "@context": "https://schema.org",
 "@type": "Event",
 name: event.title,
 description: event.description,
 startDate: serializeDate(event.startDate),
 endDate: serializeDate(event.endDate),
 location: event.address
 ? {
 "@type": "Place",
 name: event.address,
 address: { "@type": "PostalAddress", streetAddress: event.address },
 }
 : undefined,
 image: event.imageUrl ?? undefined,
 eventStatus: "https://schema.org/EventScheduled",
 eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
 organizer: {
 "@type": "Organization",
 name: unit.name,
 url: siteUrl,
 },
 };

 const isPast = event.startDate < new Date();

 return (
 <>
 <JsonLd data={jsonLd} />

 <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
 {/* Voltar */}
 <Link
 href="/eventos"
 className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-foreground-muted transition-colors hover:text-accent"
 >
 <ArrowLeft size={14} />
 Voltar aos eventos
 </Link>

 {/* Banner */}
 {event.imageUrl && (
 <div className="relative mb-10 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-surface-2">
 <Image
 src={event.imageUrl}
 alt={event.title}
 fill
 sizes="(max-width: 768px) 100vw, 896px"
 className="object-cover"
 priority
 />
 </div>
 )}

 {/* Categoria */}
 <span className="inline-block rounded-full border border-border-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
 {event.category}
 </span>

 {/* Título */}
 <h1 className="font-display mt-4 text-[clamp(2rem,6vw,4rem)] uppercase leading-[0.92] text-foreground">
 {event.title}
 </h1>

 {/* Meta informações */}
 <div className="mt-6 flex flex-col gap-3 text-sm text-foreground-muted sm:flex-row sm:flex-wrap sm:gap-6">
 <span className="flex items-center gap-2">
 <Calendar size={16} className="shrink-0 text-foreground-subtle" />
 {formatDate(event.startDate)}
 </span>
 <span className="flex items-center gap-2">
 <Clock size={16} className="shrink-0 text-foreground-subtle" />
 {formatTime(event.startDate)}
 {event.endDate && ` — ${formatTime(event.endDate)}`}
 </span>
 {event.address && (
 <span className="flex items-center gap-2">
 <MapPin size={16} className="shrink-0 text-foreground-subtle" />
 {event.address}
 </span>
 )}
 </div>

 {/* Descrição */}
 <div className="mt-10 whitespace-pre-line text-base leading-relaxed text-foreground-muted sm:text-lg">
 {event.description}
 </div>

 {/* Ações */}
 {!isPast && (
 <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
 {formSlug ? (
 <Link
 href={`/formularios/${formSlug}`}
 className="inline-flex items-center justify-center gap-2 bg-accent px-8 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-accent-contrast transition-opacity hover:opacity-85"
 >
 <Users size={14} />
 Inscreva-se
 </Link>
 ) : null}

 {event.groupUrl && (
 <a
 href={event.groupUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center justify-center gap-2 border border-border-soft px-8 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-foreground transition-colors hover:border-accent hover:text-accent"
 >
 <MessageCircle size={14} />
 Entrar no grupo
 </a>
 )}
 </div>
 )}

 {/* Mensagem de confirmação personalizada (exibida como info quando há formulário) */}
 {event.confirmationMessage && !isPast && (
 <div className="mt-8 rounded-xl border border-border-subtle bg-surface p-6 text-sm text-foreground-muted">
 {event.confirmationMessage}
 </div>
 )}

 {/* Evento encerrado */}
 {isPast && (
 <div className="mt-10 rounded-xl border border-border-subtle bg-surface p-6 text-center text-sm text-foreground-subtle">
 Este evento já foi realizado. Obrigado pela participação!
 </div>
 )}
 </div>
 </>
 );
}