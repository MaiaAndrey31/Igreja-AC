import Image from "next/image";
import { ArrowUpRight, Play } from "lucide-react";
import { messages, youtubeThumbnail, youtubeWatchUrl } from "@/data/messages";
import { getSocialLink } from "@/data/socialLinks";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { Pending } from "@/components/ui/Pending";
import { formatMessageDate } from "@/lib/format";

/**
 * Últimas mensagens.
 *
 * A unidade publica a série "Uma Vida Abençoada" (fonte: Instagram/página da
 * unidade), mas nenhum vídeo específico tem link confirmado — por isso
 * `messages` está vazio e a seção assume o estado pendente. O CTA aponta
 * para o Instagram (canal confirmado), não para o YouTube: o Linktree da
 * unidade cita um canal, mas não temos o handle/URL exato dele. As thumbs,
 * quando houver mensagens, vêm do próprio YouTube (i.ytimg.com, liberado no
 * CSP e em images.remotePatterns) e carregam em lazy — nenhum player é
 * embutido, então a seção não puxa o iframe pesado do YouTube.
 */
export function LatestMessages() {
  const instagram = getSocialLink("instagram");

  return (
    <section className="on-paper">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <SectionEyebrow index={5}>Assista de onde estiver</SectionEyebrow>

        <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display max-w-2xl text-[clamp(2.25rem,7vw,4.5rem)] uppercase text-foreground">
            A palavra não fica presa no domingo.
          </h2>

          <a
            href={instagram.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 border-b border-accent pb-1 text-[11px] uppercase tracking-[0.18em] text-accent transition-colors hover:border-foreground hover:text-foreground"
          >
            Ver no Instagram
            <ArrowUpRight size={14} />
          </a>
        </div>

        {messages.length === 0 ? (
          <div className="mt-12 border-t border-border-subtle pt-8">
            <p className="flex flex-wrap items-center gap-3 text-sm text-foreground-subtle">
              Mensagens em destaque: <Pending />
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground-subtle">
              A igreja publica a série &quot;Uma Vida Abençoada&quot; nas redes. Assim que indicar quais vídeos
              destacar aqui (com o link), eles aparecem nesta seção.
            </p>
          </div>
        ) : (
          <ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {messages.map((message) => (
              <li key={message.slug}>
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
                    {formatMessageDate(message.date)} · {message.speaker}
                  </p>
                  <h3 className="font-display mt-2 text-2xl uppercase text-foreground transition-colors group-hover:text-accent">
                    {message.title}
                  </h3>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
