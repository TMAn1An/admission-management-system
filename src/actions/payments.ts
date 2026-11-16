"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { formatMoney, toMinor } from "@/lib/finance";
import { nextPaymentNumber, withTransaction } from "@/lib/tx";
import { paymentSchema, parseForm, toDate, type ActionState } from "@/lib/validation";

export async function recordPayment(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = parseForm(paymentSchema, formData);
  if (parsed.error) return parsed.error;
  const { admissionId, amount, paidOn, method } = parsed.data;

  const outcome: { error?: string } = await withTransaction(async (tx): Promise<{ error?: string }> => {
    // SQLite serialises writers: if another clerk commits first, this transaction fails and is retried on fresh data.
    const admission = await tx.admission.findUnique({ where: { id: admissionId }, select: { fee: true } });
    if (!admission) return { error: "Admission not found." };

    const { _sum } = await tx.payment.aggregate({ where: { admissionId }, _sum: { amount: true } });
    const remaining = toMinor(admission.fee) - toMinor(_sum.amount ?? 0);
    if (remaining <= 0) return { error: "This admission is already paid in full." };
    if (toMinor(amount) > remaining) {
      return { error: `Amount exceeds the remaining balance of ${formatMoney(remaining / 100)}.` };
    }
    await tx.payment.create({
      data: { number: await nextPaymentNumber(tx), admissionId, amount, paidOn: toDate(paidOn), method, receivedById: user.id },
    });
    return {};
  });

  if (outcome.error) {
    return { message: "Please fix the highlighted fields.", fieldErrors: { amount: [outcome.error] }, values: { paidOn, method, amount: String(amount) } };
  }
  revalidatePath(`/admissions/${admissionId}`);
  revalidatePath("/admissions");
  revalidatePath("/dashboard");
  return { ok: true, message: "Payment recorded." };
}
