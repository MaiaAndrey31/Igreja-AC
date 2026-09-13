"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { unit } from "@/data/unit";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/sobre", label: "Nossa história" },
  { href: "/ministerios", label: "Ministérios" },
  { href: "/celulas", label: "Células" },
  { href: "/mensagens", label: "Mensagens" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Trava o scroll do fundo enquanto o menu mobile (fullscreen) está aberto.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  // Fecha o menu mobile ao navegar — ajustado durante a renderização (em vez
  // de um efeito) seguindo o padrão recomendado para "resetar estado quando
  // uma prop muda": https://react.dev/learn/you-might-not-need-an-effect
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled || mobileOpen
          ? "border-b border-[#2a2722] bg-ink/95 backdrop-blur-xl"
          : "border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:h-20 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${unit.name} — início`}>
          {/* Ícone real da marca (variante para fundo escuro — bg-ink do
              header combina com o preto já embutido na imagem). */}
          <Image
            src="/assets/brand/logo-icon-dark.jpg"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain"
            priority
          />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg leading-none text-paper uppercase sm:text-xl">
              Amor e Cuidado
            </span>
            <span className="font-data mt-1 text-[10px] uppercase tracking-[0.2em] text-foreground-subtle">
              Adamantina
            </span>
          </span>
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={cn(
                "text-[11px] uppercase tracking-[0.18em] transition-colors hover:text-accent",
                pathname === link.href ? "text-accent" : "text-paper/80"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/celulas"
          className="hidden border border-accent px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent hover:text-accent-contrast lg:inline-block"
        >
          Encontre uma célula
        </Link>

        <button
          type="button"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileOpen}
          aria-controls="menu-mobile"
          onClick={() => setMobileOpen((open) => !open)}
          className="-mr-2 p-2 text-paper lg:hidden"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <nav
          id="menu-mobile"
          aria-label="Navegação principal"
          className="h-[calc(100dvh-4rem)] overflow-y-auto bg-ink px-5 pb-16 pt-6 lg:hidden"
        >
          <ul className="flex flex-col">
            {NAV_LINKS.map((link, index) => (
              <li key={link.href} className="border-t border-[#2a2722]">
                <Link
                  href={link.href}
                  className="flex items-baseline gap-4 py-4 transition-colors hover:text-accent"
                >
                  <span className="font-data text-[11px] text-[#8c8577]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-3xl uppercase text-paper">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/celulas"
            className="mt-8 block border border-accent py-4 text-center text-[11px] uppercase tracking-[0.18em] text-accent"
          >
            Encontre uma célula
          </Link>

          <p className="font-data mt-8 text-[11px] leading-relaxed text-[#8c8577]">
            {unit.contact.phoneDisplay}
            <br />
            {unit.contact.email}
          </p>
        </nav>
      )}
    </header>
  );
}
