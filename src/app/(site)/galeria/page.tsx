import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GalleryGrid } from "@/components/galeria/GalleryGrid";
import { getGalleryImages } from "@/lib/data";

export const metadata: Metadata = {
  title: "Galeria",
  description: "Registros de cultos, células e eventos da Igreja Amor e Cuidado.",
  alternates: { canonical: "/galeria" },
};

// Conteúdo editado pelo painel admin precisa aparecer em tempo real.
export const dynamic = "force-dynamic";

export default async function GaleriaPage() {
  const images = await getGalleryImages();

  return (
    <div>
      <PageHeader
        eyebrow="Memórias"
        title="Galeria"
        description="Registros dos nossos cultos, células e eventos."
      />

      <div className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-border-subtle bg-surface px-5 py-4">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-xs leading-relaxed text-foreground-subtle">
            As imagens aqui exibidas foram captadas em espaços e cultos públicos da igreja, para fins institucionais
            e evangelísticos (Art. 20 do Código Civil). Se você aparece em uma foto e prefere que ela não seja
            exibida, pode solicitar a remoção — veja como em{" "}
            <Link href="/direito-de-imagem" className="underline decoration-accent/50 underline-offset-2 hover:text-accent">
              Direito de Imagem
            </Link>
            .
          </p>
        </div>

        {images.length === 0 ? (
          <p className="text-center text-sm text-foreground-subtle">Nenhuma foto publicada no momento.</p>
        ) : (
          <GalleryGrid images={images} />
        )}
      </div>
    </div>
  );
}
