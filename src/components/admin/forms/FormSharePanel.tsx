"use client";

import { useState } from "react";
import { Copy, Check, QrCode as QrIcon } from "lucide-react";
import { QrCode } from "@/components/forms/QrCode";

interface FormSharePanelProps {
 slug: string;
 title: string;
}

export function FormSharePanel({ slug, title }: FormSharePanelProps) {
 const [copied, setCopied] = useState(false);
 const [showQr, setShowQr] = useState(false);

 const publicUrl =
 typeof window !== "undefined"
 ? `${window.location.origin}/formularios/${slug}`
 : `/formularios/${slug}`;

 async function handleCopy() {
 try {
 await navigator.clipboard.writeText(publicUrl);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 } catch {
 // Fallback para browsers sem clipboard API
 const textarea = document.createElement("textarea");
 textarea.value = publicUrl;
 textarea.style.position = "fixed";
 textarea.style.opacity = "0";
 document.body.appendChild(textarea);
 textarea.select();
 document.execCommand("copy");
 document.body.removeChild(textarea);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 }
 }

 function handleShareWhatsApp() {
 const text = encodeURIComponent(
 `Inscreva-se em "${title}": ${publicUrl}`
 );
 window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
 }

 return (
 <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5">
 <h3 className="font-display text-sm uppercase tracking-wider text-foreground-subtle">
 Compartilhar formulário
 </h3>

 {/* URL + copiar */}
 <div className="flex items-center gap-2">
 <code className="flex-1 truncate rounded-lg border border-border-subtle bg-background px-3 py-2 font-data text-xs text-foreground-muted">
 {publicUrl}
 </code>
 <button
 type="button"
 onClick={handleCopy}
 className="shrink-0 rounded-lg border border-border-soft p-2 text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
 title="Copiar link"
 >
 {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
 </button>
 </div>

 {/* Ações */}
 <div className="flex flex-wrap gap-2">
 <button
 type="button"
 onClick={handleShareWhatsApp}
 className="inline-flex items-center gap-2 rounded-lg border border-border-soft px-4 py-2 text-xs font-medium text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
 >
 Compartilhar no WhatsApp
 </button>
 <button
 type="button"
 onClick={() => setShowQr(!showQr)}
 className="inline-flex items-center gap-2 rounded-lg border border-border-soft px-4 py-2 text-xs font-medium text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
 >
 <QrIcon size={14} />
 {showQr ? "Ocultar QR Code" : "Gerar QR Code"}
 </button>
 </div>

 {/* QR Code */}
 {showQr && (
 <div className="flex flex-col items-center gap-3 rounded-lg border border-border-subtle bg-background p-6">
 <QrCode value={publicUrl} size={200} fgColor="#f6f2ea" />
 <p className="text-xs text-foreground-subtle">
 Escaneie para abrir o formulário
 </p>
 </div>
 )}
 </div>
 );
}