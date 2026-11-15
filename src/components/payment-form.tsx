"use client";

import { recordPayment } from "@/actions/payments";
import { ActionForm, SelectField, SubmitButton, TextField } from "@/components/form";

export function PaymentForm({ admissionId, balance, balanceLabel, today }: { admissionId: string; balance: number; balanceLabel: string; today: string }) {
  return (
    <ActionForm action={recordPayment} hidden={{ admissionId }} className="space-y-4 p-5">
      <TextField name="amount" label="Amount (৳)" type="number" step="0.01" min="0.01" max={balance} inputMode="decimal" required hint={`Up to ${balanceLabel}`} />
      <TextField name="paidOn" label="Payment date" type="date" required defaultValue={today} />
      <SelectField name="method" label="Method" defaultValue="CASH" options={[{ value: "CASH", label: "Cash" }, { value: "CARD", label: "Card" }, { value: "ONLINE", label: "Online" }, { value: "CHEQUE", label: "Cheque" }]} />
      <SubmitButton className="w-full" pending="Recording…">Record payment</SubmitButton>
    </ActionForm>
  );
}
