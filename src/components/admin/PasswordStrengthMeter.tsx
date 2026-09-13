"use client";

import { estimatePasswordStrength } from "@/lib/auth/password";
import { cn } from "@/lib/utils";

const LEVELS: Record<ReturnType<typeof estimatePasswordStrength>, { width: string; color: string; label: string }> = {
  fraca: { width: "w-1/3", color: "bg-red-500", label: "Fraca" },
  média: { width: "w-2/3", color: "bg-amber-400", label: "Média" },
  forte: { width: "w-full", color: "bg-emerald-400", label: "Forte" },
};

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const level = LEVELS[estimatePasswordStrength(password)];

  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div className={cn("h-full rounded-full transition-all duration-300", level.width, level.color)} />
      </div>
      <span className="w-12 text-xs text-foreground-subtle">{level.label}</span>
    </div>
  );
}
