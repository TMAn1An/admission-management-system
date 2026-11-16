"use client";

import { resetPasswordWithToken } from "@/actions/password-reset";
import { ActionForm, SubmitButton, TextField } from "@/components/form";

export function ResetForm({ token }: { token: string }) {
  return (
    <ActionForm action={resetPasswordWithToken.bind(null, token)} className="space-y-4">
      <TextField name="newPassword" label="New password" type="password" autoComplete="new-password" required hint="At least 10 characters." />
      <TextField name="confirmPassword" label="Repeat new password" type="password" autoComplete="new-password" required />
      <SubmitButton className="w-full" pending="Saving…">Set new password</SubmitButton>
    </ActionForm>
  );
}
