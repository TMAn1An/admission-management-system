import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { PaymentForm } from "@/components/payment-form";
import { PrintButton } from "@/components/print-button";
import { Card, CardHeader, Notice, PageHeader, StatusBadge, Table, Td, Th, ButtonLink } from "@/components/ui";
import { admissionNo, formatDate, receiptNo, todayInput } from "@/lib/format";
import { formatMoney } from "@/lib/finance";
import { getAdmission } from "@/lib/queries";

export const metadata: Metadata = { title: "Admission slip" };
export const dynamic = "force-dynamic";

const METHOD = { CASH: "Cash", CARD: "Card", ONLINE: "Online", CHEQUE: "Cheque" } as const;

export default async function AdmissionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, flags] = await Promise.all([params, searchParams]);
  const a = await getAdmission(id);
  if (!a) notFound();

  const rows: [string, string][] = [
    ["Admission no.", admissionNo(a.number)],
    ["Admission date", formatDate(a.admissionDate)],
    ["Student", a.student.name],
    ["Date of birth", formatDate(a.student.dob)],
    ["Email", a.student.email],
    ["Phone", a.student.phone],
    ["Course", a.course.name],
    ["Department", a.course.department?.name ?? "—"],
    ["Duration", a.course.duration],
  ];

  return (
    <>
      <PageHeader
        title={`Admission ${admissionNo(a.number)}`}
        description={`${a.student.name} · ${a.course.name}`}
        actions={
          <>
            <ButtonLink href={`/students/${a.student.id}`} variant="secondary">View student</ButtonLink>
            <PrintButton />
          </>
        }
      />
      {flags.created && <Notice>Admission created successfully.</Notice>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="print-sheet p-6 sm:p-8">
            <div className="flex items-start justify-between border-b border-slate-200 pb-5">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-lg bg-brand-600 text-white"><GraduationCap className="size-6" aria-hidden="true" /></span>
                <div>
                  <p className="text-lg font-semibold leading-tight">Admission Confirmation</p>
                  <p className="text-sm text-slate-500">Official admission slip</p>
                </div>
              </div>
              <StatusBadge status={a.status} />
            </div>
            <dl className="mt-6 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k}><dt className="text-slate-500">{k}</dt><dd className="mt-0.5 font-medium text-slate-900">{v}</dd></div>
              ))}
            </dl>
            <div className="mt-6 grid grid-cols-3 gap-4 rounded-lg bg-slate-50 p-4 text-sm">
              <div><p className="text-slate-500">Total fee</p><p className="mt-0.5 font-semibold">{formatMoney(a.fee)}</p></div>
              <div><p className="text-slate-500">Paid</p><p className="mt-0.5 font-semibold text-emerald-700">{formatMoney(a.paid)}</p></div>
              <div><p className="text-slate-500">Balance</p><p className="mt-0.5 font-semibold text-amber-700">{formatMoney(a.balance)}</p></div>
            </div>
            <div className="mt-12 hidden grid-cols-2 gap-16 text-center text-xs text-slate-500 print:grid">
              <div className="border-t border-slate-400 pt-2">Student signature</div>
              <div className="border-t border-slate-400 pt-2">Authorised signature &amp; seal</div>
            </div>
          </Card>

          <Card className="print-sheet">
            <CardHeader title="Payment history" />
            {a.payments.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">No payments recorded yet.</p>
            ) : (
              <Table>
                <thead><tr><Th>Receipt</Th><Th>Date</Th><Th>Method</Th><Th>Received by</Th><Th className="text-right">Amount</Th></tr></thead>
                <tbody>
                  {a.payments.map((p) => (
                    <tr key={p.id}>
                      <Td>{receiptNo(p.number)}</Td>
                      <Td>{formatDate(p.paidOn)}</Td>
                      <Td>{METHOD[p.method]}</Td>
                      <Td>{p.receivedBy?.name ?? "—"}</Td>
                      <Td className="text-right font-medium">{formatMoney(p.amount)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        <Card className="no-print h-fit">
          <CardHeader title="Record payment" description={a.balance > 0 ? `${formatMoney(a.balance)} outstanding` : undefined} />
          {a.balance > 0 ? (
            <PaymentForm admissionId={a.id} balance={a.balance} balanceLabel={formatMoney(a.balance)} today={todayInput()} />
          ) : (
            <p className="p-5 text-sm text-emerald-800">This admission is paid in full. No further payment is due.</p>
          )}
        </Card>
      </div>
    </>
  );
}
