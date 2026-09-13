"use client";

import { useActionState } from "react";
import { Lock, Mail } from "lucide-react";
import { loginAction, type ActionState } from "@/actions/auth";
import { FieldGroup, Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

const initialState: ActionState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FieldGroup label="E-mail" htmlFor="email">
        <div className="relative">
          <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-subtle" />
          <Input id="email" name="email" type="email" autoComplete="username" required className="pl-10" />
        </div>
      </FieldGroup>

      <FieldGroup label="Senha" htmlFor="password">
        <div className="relative">
          <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-subtle" />
          <Input id="password" name="password" type="password" autoComplete="current-password" required className="pl-10" />
        </div>
      </FieldGroup>

      {state.error && (
        <p role="alert" className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2.5 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <SubmitButton pendingLabel="Entrando..." className="mt-2 w-full">
        Entrar
      </SubmitButton>
    </form>
  );
}
