"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface SubmitButtonProps extends React.ComponentProps<typeof Button> {
  pendingLabel?: string;
}

export function SubmitButton({ children, pendingLabel = "Salvando...", className, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={cn(className)} {...props}>
      {pending && <Loader2 size={16} className="animate-spin" />}
      {pending ? pendingLabel : children}
    </Button>
  );
}
