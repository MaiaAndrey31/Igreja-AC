import { Plus } from "lucide-react";

interface AdminListHeaderProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function AdminListHeader({ title, description, actionLabel, onAction }: AdminListHeaderProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-foreground-subtle">{description}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-background transition-colors hover:bg-accent"
      >
        <Plus size={15} />
        {actionLabel}
      </button>
    </div>
  );
}
