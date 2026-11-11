"use client";

import { useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";

interface QrCodeProps {
  /** URL ou texto a ser codificado no QR Code. */
  value: string;
  /** Tamanho em pixels (quadrado). Padrão: 200. */
  size?: number;
  /** Cor do módulo (foreground). Padrão: #14120f (ink da marca). */
  fgColor?: string;
  /** Cor de fundo. Padrão: #f6f2ea (paper da marca). */
  bgColor?: string;
  /** Classe CSS adicional. */
  className?: string;
}

/**
 * Componente QR Code real usando a biblioteca `qrcode`.
 * Gera QR Codes escaneáveis localmente via Canvas API.
 * Suporta download como PNG e funciona em dispositivos móveis.
 */
export function QrCode({
  value,
  size = 200,
  fgColor = "#14120f",
  bgColor = "#f6f2ea",
  className = "",
}: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;

    // Cancela renderizações anteriores se o valor mudar rapidamente
    let cancelled = false;

    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 2,
      color: {
        dark: fgColor,
        light: bgColor,
      },
      errorCorrectionLevel: "M",
    })
      .then(() => {
        if (cancelled) return;
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Falha ao gerar QR Code:", err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [value, size, fgColor, bgColor]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `qrcode-${value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Falha ao baixar QR Code:", err);
    }
  }, [value]);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <canvas
        ref={canvasRef}
        className="rounded-lg"
        role="img"
        aria-label={`QR Code para ${value}`}
      />
      <button
        type="button"
        onClick={handleDownload}
        className="rounded-lg border border-border-soft px-4 py-2 text-xs font-medium text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        Baixar QR Code (PNG)
      </button>
    </div>
  );
}