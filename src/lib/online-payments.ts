import "server-only";
import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { balance, formatMoney, sumDecimals, toMinor } from "@/lib/finance";
import { admissionNo, formatDate, receiptNo } from "@/lib/format";
import { sendMail, sign_off } from "@/lib/mail";
import { nextPaymentNumber, withTransaction } from "@/lib/tx";

import type { PaymentAttempt } from "@prisma/client";

export async function createAttempt(admissionId: string, amount: number, payerEmail: string): Promise<{ error: string } | { attempt: PaymentAttempt }> {
  const admission = await db.admission.findUnique({ where: { id: admissionId }, include: { payments: { select: { amount: true } } } });
  if (!admission) return { error: "Admission not found." };
  const due = balance(admission.fee, sumDecimals(admission.payments.map((p) => p.amount)));
  if (due <= 0) return { error: "This admission is already paid in full." };
  if (toMinor(amount) < 100) return { error: "The minimum online payment is ৳1." };
  if (toMinor(amount) > toMinor(due)) return { error: `Amount exceeds the remaining balance of ${formatMoney(due)}.` };
  const attempt = await db.paymentAttempt.create({
    data: { tranId: `AMS${Date.now()}${randomBytes(4).toString("hex")}`, admissionId, amount, payerEmail },
  });
  return { attempt };
}

/**
 * Credit a paid attempt exactly once. Safe to call repeatedly (browser redirect + IPN, retries):
 * the attempt status and the unique Payment.reference make a second call a no-op.
 */
export async function settleAttempt(tranId: string, gatewayRef?: string) {
  const result = await withTransaction(async (tx) => {
    const attempt = await tx.paymentAttempt.findUnique({ where: { tranId } });
    if (!attempt) return null;
    if (attempt.status === "PAID") return { attempt, created: false as const };

    const admission = await tx.admission.findUnique({ where: { id: attempt.admissionId }, select: { fee: true } });
    const { _sum } = await tx.payment.aggregate({ where: { admissionId: attempt.admissionId }, _sum: { amount: true } });
    const remaining = toMinor(admission?.fee ?? 0) - toMinor(_sum.amount ?? 0);
    // Money has already left the payer. If a staff payment cleared the balance meanwhile, still record it and flag it.
    const note = toMinor(attempt.amount) > remaining ? "Paid online after the balance had changed; review for a refund." : null;

    const payment = await tx.payment.create({
      data: {
        number: await nextPaymentNumber(tx),
        admissionId: attempt.admissionId,
        amount: attempt.amount,
        paidOn: new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`),
        method: "ONLINE",
        reference: attempt.tranId,
      },
    });
    const updated = await tx.paymentAttempt.update({ where: { id: attempt.id }, data: { status: "PAID", gatewayRef: gatewayRef ?? null, note } });
    return { attempt: updated, payment, created: true as const };
  }).catch((e) => {
    // A concurrent callback won the race on the unique reference: treat as already settled.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { attempt: null, created: false as const };
    throw e;
  });

  if (result?.created && "payment" in result) {
    const adm = await db.admission.findUnique({ where: { id: result.attempt.admissionId }, include: { student: true, course: true } });
    if (adm) {
      await sendMail({
        to: adm.student.email,
        subject: `Payment received — ${admissionNo(adm.number)}`,
        text: `Dear ${adm.student.name},\n\nWe received your online payment of ${formatMoney(result.attempt.amount)} for ${adm.course.name} (${admissionNo(adm.number)}).\nReceipt: ${receiptNo(result.payment.number)} · ${formatDate(result.payment.paidOn)}${sign_off()}`,
      });
    }
  }
  return result;
}

export async function failAttempt(tranId: string, status: "FAILED" | "CANCELLED") {
  await db.paymentAttempt.updateMany({ where: { tranId, status: "INITIATED" }, data: { status } });
}
