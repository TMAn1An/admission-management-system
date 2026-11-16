"use client";

import { requestPasswordReset } from "@/actions/password-reset";
import { ActionForm, SubmitButton, TextField } from "@/components/form";

export function ForgotForm() {
  return (
    <ActionForm action={requestPasswordReset} className="space-y-4">
      <TextField name="email" label="Email" type="email" required autoComplete="email" />
      <SubmitButton className="w-full" pending="Sending…">Send reset link</SubmitButton>
    </ActionForm>
  );
}
