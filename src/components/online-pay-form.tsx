"use client";

import { startOnlinePayment } from "@/actions/public";
import { ActionForm, SubmitButton, TextField } from "@/components/form";

export function OnlinePayForm({ applicationNumber, balance, balanceLabel }: { applicationNumber: number; balance: number; balanceLabel: string }) {
  return (
    <ActionForm action={startOnlinePayment.bind(null, applicationNumber)} className="space-y-3">
      <TextField name="amount" label="Amount to pay (৳)" type="number" step="0.01" min="1" max={balance} inputMode="decimal" defaultValue={String(balance)} required hint={`Balance due: ${balanceLabel}. You can pay in instalments.`} />
      <SubmitButton className="w-full" pending="Opening secure payment…">Pay online</SubmitButton>
    </ActionForm>
  );
}
