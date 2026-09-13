"use client";

import { useActionState, useState } from "react";
import { changePasswordAction } from "@/actions/auth";
import type { ActionState } from "@/actions/auth";
import { FieldGroup, Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { PasswordStrengthMeter } from "@/components/admin/PasswordStrengthMeter";

const emptyState: ActionState = {};

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, emptyState);
  const [newPassword, setNewPassword] = useState("");

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <FieldGroup label="Senha atual" htmlFor="currentPassword">
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </FieldGroup>

      <FieldGroup
        label="Nova senha"
        htmlFor="newPassword"
        hint="Mínimo 10 caracteres, com maiúscula, minúscula, número e caractere especial."
      >
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </FieldGroup>
      <PasswordStrengthMeter password={newPassword} />

      <FieldGroup label="Confirmar nova senha" htmlFor="confirmPassword">
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
      </FieldGroup>

      {state.error && (
        <p role="alert" className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2.5 text-sm text-red-300">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-4 py-2.5 text-sm text-emerald-300">
          Senha atualizada com sucesso.
        </p>
      )}

      <SubmitButton pendingLabel="Salvando..." className="mt-2 self-start">
        Alterar senha
      </SubmitButton>
    </form>
  );
}
