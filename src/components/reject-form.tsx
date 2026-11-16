"use client";

import { rejectApplication } from "@/actions/applications";
import { ActionForm, SubmitButton, TextArea } from "@/components/form";

export function RejectForm({ id }: { id: string }) {
  return (
    <ActionForm action={rejectApplication.bind(null, id)} className="space-y-3">
      <TextArea name="note" label="Reason (sent to the applicant)" rows={2} required />
      <SubmitButton pending="Rejecting…" className="bg-red-600 hover:bg-red-700">Reject application</SubmitButton>
    </ActionForm>
  );
}
