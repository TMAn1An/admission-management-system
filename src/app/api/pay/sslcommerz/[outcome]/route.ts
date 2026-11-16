import { NextResponse } from "next/server";
import { isValidPayment, validatePayment } from "@/lib/gateway";
import { failAttempt, settleAttempt } from "@/lib/online-payments";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * SSLCommerz posts here for success, fail, cancel and server-to-server IPN.
 * A "success" post is never trusted on its own: the transaction is re-validated with the gateway before crediting.
 */
export async function POST(request: Request, { params }: { params: Promise<{ outcome: string }> }) {
  const { outcome } = await params;
  const form = await request.formData();
  const tranId = String(form.get("tran_id") ?? "");
  const valId = String(form.get("val_id") ?? "");
  const redirectTo = (t: string) => NextResponse.redirect(new URL(`/pay/result?tran=${encodeURIComponent(t)}`, request.url), 303);

  if (!tranId) return new NextResponse("Bad request", { status: 400 });
  const attempt = await db.paymentAttempt.findUnique({ where: { tranId } });
  if (!attempt) return new NextResponse("Unknown transaction", { status: 404 });

  if (outcome === "fail") await failAttempt(tranId, "FAILED");
  else if (outcome === "cancel") await failAttempt(tranId, "CANCELLED");
  else if (outcome === "success" || outcome === "ipn") {
    if (attempt.status !== "PAID" && valId) {
      const validation = await validatePayment(valId);
      if (isValidPayment(attempt, validation)) await settleAttempt(tranId, validation?.bank_tran_id ?? valId);
    }
    if (outcome === "ipn") return new NextResponse("OK");
  } else return new NextResponse("Not found", { status: 404 });

  return redirectTo(tranId);
}
