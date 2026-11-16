"use client";

import { approveApplication } from "@/actions/applications";
import { ActionForm, SubmitButton } from "@/components/form";

export function ApproveForm({ id }: { id: string }) {
  return (
    <ActionForm action={approveApplication.bind(null, id)}>
      <SubmitButton pending="Approving…">Approve &amp; create admission</SubmitButton>
    </ActionForm>
  );
}
