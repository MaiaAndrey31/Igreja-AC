import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Login administrativo" };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="font-display text-xl uppercase text-foreground">
            Amor <span className="text-accent">e</span> Cuidado
          </p>
          <h1 className="mt-3 text-xl text-foreground-muted">Painel administrativo</h1>
        </div>

        <div className="mt-8 rounded-2xl border border-border-subtle bg-surface p-7">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-foreground-subtle">Acesso restrito à equipe autorizada.</p>
      </div>
    </div>
  );
}
