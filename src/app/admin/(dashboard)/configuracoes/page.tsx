import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data";
import { SettingsForm } from "@/components/admin/settings/SettingsForm";

export const metadata: Metadata = { title: "Configurações · Admin" };

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="font-display text-2xl tracking-wide text-foreground">Configurações</h1>
      <p className="mt-2 text-sm text-foreground-subtle">Hero da home e dados de doação exibidos no site.</p>
      <div className="mt-8 max-w-2xl">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
