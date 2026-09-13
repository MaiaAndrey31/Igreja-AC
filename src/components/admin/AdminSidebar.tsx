"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Users,
  Megaphone,
  Images,
  Settings,
  KeyRound,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard },
  { href: "/admin/ministerios", label: "Ministérios", icon: Sparkles },
  { href: "/admin/celulas", label: "Células", icon: Users },
  { href: "/admin/avisos", label: "Avisos", icon: Megaphone },
  { href: "/admin/galeria", label: "Galeria", icon: Images },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
  { href: "/admin/senha", label: "Senha", icon: KeyRound },
];

export function AdminSidebar({ adminEmail }: { adminEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border-subtle bg-surface lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="px-6 py-6">
        <p className="font-display text-base uppercase text-foreground">
          Amor <span className="text-accent">e</span> Cuidado
        </p>
        <p className="mt-1 truncate text-xs text-foreground-subtle">{adminEmail}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-x-auto px-3 pb-4 lg:overflow-visible">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active ? "bg-accent/15 text-accent" : "text-foreground-muted hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-border-subtle px-3 py-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <ExternalLink size={16} />
          Ver site
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground-muted transition-colors hover:bg-red-950/30 hover:text-red-300"
          >
            <LogOut size={16} />
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
