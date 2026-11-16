import type { Metadata } from "next";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/finance";
import { admissionNo } from "@/lib/format";

export const metadata: Metadata = { title: "Payment result" };
export const dynamic = "force-dynamic";

export default async function PayResult({ searchParams }: { searchParams: Promise<{ tran?: string }> }) {
  const { tran } = await searchParams;
  const attempt = tran ? await db.paymentAttempt.findUnique({ where: { tranId: tran }, include: { admission: true } }) : null;
  const view = !attempt
    ? { icon: XCircle, color: "text-red-600", title: "Payment not found", text: "We could not find this payment." }
    : attempt.status === "PAID"
      ? { icon: CheckCircle2, color: "text-emerald-600", title: "Payment received", text: `Thank you. ${formatMoney(attempt.amount)} was credited to ${admissionNo(attempt.admission.number)}. A receipt was emailed to you when email is enabled.` }
      : attempt.status === "INITIATED"
        ? { icon: Clock, color: "text-amber-600", title: "Confirming your payment", text: "The bank has not confirmed yet. This can take a minute — refresh this page. If you were charged, your balance will update automatically." }
        : { icon: XCircle, color: "text-red-600", title: attempt.status === "CANCELLED" ? "Payment cancelled" : "Payment failed", text: "You were not charged. You can try again from your application status page." };
  const Icon = view.icon;
  return (
    <div className="mx-auto max-w-md text-center">
      <Icon className={`mx-auto size-12 ${view.color}`} aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{view.title}</h1>
      <p className="mt-2 text-slate-600">{view.text}</p>
      <div className="mt-6 flex justify-center gap-3"><ButtonLink href="/status">Back to my application</ButtonLink></div>
    </div>
  );
}
