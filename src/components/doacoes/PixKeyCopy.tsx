"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function PixKeyCopy({ pixKey, pixKeyType }: { pixKey: string; pixKeyType: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pixKey);
    } catch {
      // Fallback para navegadores sem Clipboard API (raro, mas mantém o botão funcional).
      const textarea = document.createElement("textarea");
      textarea.value = pixKey;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div className="bg-background p-6 sm:p-7">
      <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-subtle">Chave Pix ({pixKeyType})</p>
      <div className="mt-4 flex items-center justify-between gap-4">
        <code className="font-data truncate text-lg text-foreground">{pixKey}</code>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "flex shrink-0 items-center gap-2 border px-4 py-2 text-[11px] uppercase tracking-[0.16em] transition-colors",
            copied
              ? "border-accent text-accent"
              : "border-border-soft text-foreground hover:border-accent hover:text-accent"
          )}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
