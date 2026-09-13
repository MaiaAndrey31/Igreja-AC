import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export const metadata: Metadata = { title: "Senha · Admin" };

export default function AdminPasswordPage() {
  return (
    <div>
      <h1 className="font-display text-2xl tracking-wide text-foreground">Alterar senha</h1>
      <p className="mt-2 text-sm text-foreground-subtle">
        Recomendamos trocar a senha padrão assim que possível e periodicamente.
      </p>
      <div className="mt-8">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
