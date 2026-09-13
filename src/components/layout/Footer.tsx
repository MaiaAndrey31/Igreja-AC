import Image from "next/image";
import Link from "next/link";
import { SocialGlyph } from "@/components/ui/SocialGlyph";
import { Pending } from "@/components/ui/Pending";
import type { SocialLink, UnitInfo } from "@/lib/firebase/collections";

const INSTITUTIONAL_LINKS = [
  { href: "/sobre", label: "Nossa história" },
  { href: "/ministerios", label: "Ministérios" },
  { href: "/mensagens", label: "Mensagens" },
  { href: "/celulas", label: "Células" },
  { href: "/contribua", label: "Contribua" },
];

const LEGAL_LINKS = [
  { href: "/politica-de-privacidade", label: "Política de Privacidade" },
  { href: "/termos-de-uso", label: "Termos de Uso" },
  { href: "/direito-de-imagem", label: "Direito de Imagem" },
];

export function Footer({ unit, socialLinks }: { unit: UnitInfo; socialLinks: SocialLink[] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border-subtle bg-ink">
      {/* Bloco de abertura: o rodapé começa como uma última página, não como
          uma faixa de links miúdos. */}
      <div className="mx-auto max-w-7xl px-5 pb-14 pt-20 sm:px-8 sm:pb-16 sm:pt-28">
        <p className="font-data text-[11px] uppercase tracking-[0.2em] text-foreground-subtle">
          {unit.verseReference}
        </p>
        <p className="font-display mt-5 max-w-4xl text-4xl uppercase text-paper sm:text-6xl lg:text-7xl">
          {unit.tagline}
        </p>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-foreground-subtle">{unit.originStory}</p>
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 border-t border-border-subtle py-12 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-accent">A igreja</p>
            <ul className="mt-5 flex flex-col gap-2.5">
              {INSTITUTIONAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground-muted transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-8 text-[11px] uppercase tracking-[0.22em] text-accent">Jurídico</p>
            <ul className="mt-5 flex flex-col gap-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground-muted transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Fale com a gente</p>
            <address className="font-data mt-5 not-italic text-sm leading-relaxed text-foreground-muted">
              {unit.address}
            </address>

            <ul className="mt-6 flex flex-col gap-3">
              {socialLinks.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.href}
                    {...(social.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="inline-flex items-center gap-2.5 text-sm text-foreground-muted transition-colors hover:text-accent"
                  >
                    <SocialGlyph id={social.platform} />
                    <span className="font-data text-[13px]">{social.handle}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Parte da rede</p>
            <p className="mt-5 text-sm leading-relaxed text-foreground-subtle">
              Somos a primeira extensão da rede Amor e Cuidado, com sede em {unit.networkHeadquartersCity}/
              {unit.networkHeadquartersState} desde {unit.networkFoundedYear}.
            </p>
            <a
              href={unit.networkSite}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:text-foreground"
            >
              amorecuidado.com.br
            </a>
          </div>
        </div>

        {/* Aviso de direito de imagem — o site publica fotos reais de cultos,
            então o caminho para pedir remoção precisa estar visível. */}
        <div className="border-t border-border-subtle py-8">
          <p className="max-w-3xl text-xs leading-relaxed text-foreground-subtle">
            <strong className="text-foreground-muted">Direito de imagem:</strong> os espaços e cultos públicos da
            igreja são fotografados e filmados para fins institucionais e evangelísticos, conforme o Art. 20 do
            Código Civil. Se você não deseja que uma foto sua seja exibida, pode solicitar a remoção — veja como em{" "}
            <Link
              href="/direito-de-imagem"
              className="underline decoration-accent/50 underline-offset-2 hover:text-accent"
            >
              Direito de Imagem
            </Link>
            .
          </p>
        </div>

        {/* Wordmark real como selo de fechamento — a marca oficial da igreja,
            não mais texto gerado por CSS. */}
        <div className="flex justify-center border-t border-border-subtle py-12 sm:justify-start">
          <Image
            src="/assets/brand/logo-wordmark.png"
            alt={unit.name}
            width={140}
            height={139}
            className="h-auto w-28 sm:w-36"
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-border-subtle py-8 text-xs text-foreground-subtle sm:flex-row sm:items-center sm:justify-between">
          <p className="flex flex-wrap items-center gap-2">
            <span>
              © {year} {unit.name}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-2">
              CNPJ <Pending />
            </span>
          </p>
          <p>Tratamento de dados em conformidade com a LGPD (Lei nº 13.709/2018).</p>
        </div>
      </div>
    </footer>
  );
}
