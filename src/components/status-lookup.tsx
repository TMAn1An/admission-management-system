"use client";

import { lookupStatus } from "@/actions/public";
import { ActionForm, SubmitButton, TextField } from "@/components/form";

export function StatusLookup() {
  return (
    <ActionForm action={lookupStatus} className="space-y-4">
      <TextField name="ref" label="Application number" placeholder="APP-000123" required autoComplete="off" />
      <TextField name="email" label="Email used to apply" type="email" required autoComplete="email" />
      <SubmitButton className="w-full" pending="Looking up…">Check status</SubmitButton>
    </ActionForm>
  );
}
