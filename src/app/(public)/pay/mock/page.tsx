import { notFound } from "next/navigation";
import { mockGatewayOutcome } from "@/actions/public";
import { Card } from "@/components/ui";
import { paymentsMock } from "@/lib/config";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/finance";

export const dynamic = "force-dynamic";

/** Development/test stand-in for the hosted gateway page. Unreachable in production. */
export default async function MockGateway({ searchParams }: { searchParams: Promise<{ tran?: string }> }) {
  if (!paymentsMock()) notFound();
  const tran = (await searchParams).tran ?? "";
  const attempt = await db.paymentAttempt.findUnique({ where: { tranId: tran } });
  if (!attempt) notFound();
  return (
    <div className="mx-auto max-w-sm">
      <Card className="p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Simulated gateway (development only)</p>
        <p className="mt-3 text-2xl font-semibold">{formatMoney(attempt.amount)}</p>
        <div className="mt-6 grid gap-2">
          <form action={mockGatewayOutcome.bind(null, tran, "success")}><button className="h-10 w-full rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700">Simulate successful payment</button></form>
          <form action={mockGatewayOutcome.bind(null, tran, "fail")}><button className="h-10 w-full rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50">Simulate failure</button></form>
        </div>
      </Card>
    </div>
  );
}
