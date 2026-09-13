import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, Play } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pending } from "@/components/ui/Pending";
import { formatFullDate, youtubeThumbnail, youtubeWatchUrl } from "@/lib/format";
import { getPublishedMessages, getSocialLinks } from "@/lib/data";

export const metadata: Metadata = {
  title: "Mensagens",
  description: "Pregações da Igreja Amor e Cuidado — assista de onde estiver.",
  alternates: { canonical: "/mensagens" },
};

export default async function MensagensPage() {
  const [messages, socialLinks] = await Promise.all([getPublishedMessages(), getSocialLinks()]);
  const instagramHref = socialLinks.find((social) => social.platform === "instagram")?.href ?? "#";

  return (
    <div>
      <PageHeader
        eyebrow="Palavra"
        title="Assista de onde estiver"
        description="A igreja publica a série &quot;Uma Vida Abençoada&quot; nas redes sociais, aberta para qualquer pessoa."
      />

      <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 sm:pb-32">
        {messages.length === 0 ? (
          <div className="border-t border-border-subtle pt-10">
            <Pending label="mensagens em destaque" />
            <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground-muted">
              A igreja ainda não indicou quais pregações destacar nesta página, nem o link do canal de vídeo.
              Enquanto isso, acompanhe pelo Instagram.
            </p>
            <a
              href={instagramHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 bg-accent px-7 py-4 text-[11px] uppercase tracking-[0.18em] text-accent-contrast transition-opacity hover:opacity-85"
            >
              Ir para o Instagram
              <ArrowUpRight size={15} />
            </a>
          </div>
        ) : (
          <ul className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {messages.map((message) => (
              <li key={message.id}>
                <a
                  href={youtubeWatchUrl(message.youtubeId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-surface-2">
                    <Image
                      src={youtubeThumbnail(message.youtubeId)}
                      alt=""
                      fill
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink/70 text-paper backdrop-blur-sm">
                        <Play size={20} fill="currentColor" />
                      </span>
                    </span>
                  </div>

                  <p className="font-data mt-4 text-[11px] uppercase tracking-[0.16em] text-foreground-subtle">
                    {formatFullDate(message.date)} · {message.speaker}
                  </p>
                  <h2 className="font-display mt-2 text-2xl uppercase text-foreground transition-colors group-hover:text-accent">
                    {message.title}
                  </h2>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
