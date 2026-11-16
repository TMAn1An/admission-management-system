import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStatusApplication } from "@/actions/public";
import { OnlinePayForm } from "@/components/online-pay-form";
import { PrintButton } from "@/components/print-button";
import { Badge, ButtonLink, Card, CardHeader, Notice, StatusBadge, Table, Td, Th } from "@/components/ui";
import { paymentsEnabled } from "@/lib/config";
import { formatMoney } from "@/lib/finance";
import { admissionNo, formatDate, receiptNo } from "@/lib/format";
import { applicationNo } from "@/lib/refs";
import { getAdmission } from "@/lib/queries";

export const metadata: Metadata = { title: "Application status" };
export const dynamic = "force-dynamic";

const METHOD = { CASH: "Cash", CARD: "Card", ONLINE: "Online", CHEQUE: "Cheque" } as const;

export default async function StatusResult({ params }: { params: Promise<{ number: string }> }) {
  const number = Number((await params).number);
  const app = Number.isInteger(number) ? await getStatusApplication(number) : null;
  if (!app) redirect("/status");
  const admission = app.admissionId ? await getAdmission(app.admissionId) : null;

  const tone = { PENDING: "brand", APPROVED: "green", REJECTED: "red" } as const;
  const label = { PENDING: "Under review", APPROVED: "Approved", REJECTED: "Not accepted" } as const;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Application {applicationNo(app.number)}</h1>
          <p className="mt-1 text-sm text-slate-600">{app.name} · {app.course.name}</p>
        </div>
        <Badge tone={tone[app.status]}>{label[app.status]}</Badge>
      </div>

      {app.status === "PENDING" && <Notice tone="info">Your application is being reviewed. We will email you as soon as there is a decision. Submitted {formatDate(app.createdAt)}.</Notice>}
      {app.status === "REJECTED" && (
        <Notice tone="error">We are unable to offer you a place at this time.{app.reviewNote ? ` Reason: ${app.reviewNote}` : ""}</Notice>
      )}

      {admission && (
        <>
          <Card className="print-sheet p-6 sm:p-8">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-lg font-semibold">Admission Confirmation</p>
                <p className="text-sm text-slate-500">{admissionNo(admission.number)} · {formatDate(admission.admissionDate)}</p>
              </div>
              <StatusBadge status={admission.status} />
            </div>
            <dl className="mt-5 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
              {([["Student", admission.student.name], ["Course", admission.course.name], ["Department", admission.course.department?.name ?? "—"], ["Duration", admission.course.duration]] as const).map(([k, v]) => (
                <div key={k}><dt className="text-slate-500">{k}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>
              ))}
            </dl>
            <div className="mt-6 grid grid-cols-3 gap-4 rounded-lg bg-slate-50 p-4 text-sm">
              <div><p className="text-slate-500">Total fee</p><p className="mt-0.5 font-semibold">{formatMoney(admission.fee)}</p></div>
              <div><p className="text-slate-500">Paid</p><p className="mt-0.5 font-semibold text-emerald-700">{formatMoney(admission.paid)}</p></div>
              <div><p className="text-slate-500">Balance</p><p className="mt-0.5 font-semibold text-amber-700">{formatMoney(admission.balance)}</p></div>
            </div>
          </Card>

          {admission.payments.length > 0 && (
            <Card className="print-sheet">
              <CardHeader title="Payments received" />
              <Table>
                <thead><tr><Th>Receipt</Th><Th>Date</Th><Th>Method</Th><Th className="text-right">Amount</Th></tr></thead>
                <tbody>
                  {admission.payments.map((p) => (
                    <tr key={p.id}><Td>{receiptNo(p.number)}</Td><Td>{formatDate(p.paidOn)}</Td><Td>{METHOD[p.method]}</Td><Td className="text-right font-medium">{formatMoney(p.amount)}</Td></tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}

          <div className="no-print grid gap-6 sm:grid-cols-2">
            {admission.balance > 0 && (
              <Card>
                <CardHeader title="Pay your fee" />
                <div className="p-5">
                  {paymentsEnabled() ? (
                    <OnlinePayForm applicationNumber={app.number} balance={admission.balance} balanceLabel={formatMoney(admission.balance)} />
                  ) : (
                    <p className="text-sm text-slate-600">Online payment is not available yet. Please pay at the admission office and quote {admissionNo(admission.number)}.</p>
                  )}
                </div>
              </Card>
            )}
            <Card className="h-fit">
              <CardHeader title="Your slip" />
              <div className="flex flex-wrap gap-2 p-5"><PrintButton /><ButtonLink href="/status" variant="ghost">Look up another</ButtonLink></div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
