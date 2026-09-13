import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(({ label, className, id, ...props }, ref) => {
  return (
    <label htmlFor={id} className={cn("flex cursor-pointer items-center gap-3 text-sm text-foreground-muted", className)}>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-surface-2 border border-border-subtle transition-colors has-checked:bg-accent has-checked:border-accent">
        <input ref={ref} id={id} type="checkbox" className="peer sr-only" {...props} />
        <span className="absolute left-0.5 h-5 w-5 rounded-full bg-foreground transition-transform peer-checked:translate-x-5" />
      </span>
      {label}
    </label>
  );
});
Switch.displayName = "Switch";
