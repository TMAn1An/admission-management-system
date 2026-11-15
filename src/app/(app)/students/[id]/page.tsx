import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardHeader, EmptyState, Notice, PageHeader, StatusBadge, Table, Td, Th, ButtonLink } from "@/components/ui";
import { db } from "@/lib/db";
import { admissionNo, formatDate } from "@/lib/format";
import { balance, formatMoney, paymentStatus, sumDecimals } from "@/lib/finance";

export const metadata: Metadata = { title: "Student" };
export const dynamic = "force-dynamic";

export default async function StudentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; updated?: string }> }) {
  const [{ id }, flags] = await Promise.all([params, searchParams]);
  const student = await db.student.findUnique({
    where: { id },
    include: { admissions: { include: { course: true, payments: { select: { amount: true } } }, orderBy: { createdAt: "desc" } } },
  });
  if (!student) notFound();

  const details: [string, string][] = [
    ["Email", student.email],
    ["Phone", student.phone],
    ["Date of birth", formatDate(student.dob)],
    ["Address", student.address],
  ];

  return (
    <>
      <PageHeader
        title={student.name}
        description={`Registered on ${formatDate(student.createdAt)}`}
        actions={
          <>
            <ButtonLink href={`/students/${id}/edit`} variant="secondary">Edit</ButtonLink>
            <ButtonLink href={`/admissions/new?studentId=${id}`}>New admission</ButtonLink>
          </>
        }
      />
      {flags.created && <Notice>Student registered. You can now create an admission.</Notice>}
      {flags.updated && <Notice>Student details updated.</Notice>}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader title="Details" />
          <dl className="space-y-4 p-5 text-sm">
            {details.map(([k, v]) => (
              <div key={k}><dt className="text-slate-500">{k}</dt><dd className="mt-0.5 whitespace-pre-line font-medium text-slate-900">{v}</dd></div>
            ))}
          </dl>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Admissions" />
          {student.admissions.length === 0 ? (
            <EmptyState title="Not admitted yet" description="This student has no admissions." action={<ButtonLink href={`/admissions/new?studentId=${id}`}>Create admission</ButtonLink>} />
          ) : (
            <Table>
              <thead><tr><Th>Course</Th><Th>Fee</Th><Th>Balance</Th><Th>Status</Th></tr></thead>
              <tbody>
                {student.admissions.map((a) => {
                  const paid = sumDecimals(a.payments.map((p) => p.amount));
                  return (
                    <tr key={a.id}>
                      <Td><Link href={`/admissions/${a.id}`} className="font-medium hover:text-brand-600">{a.course.name}</Link><div className="text-xs text-slate-500">{admissionNo(a.number)}</div></Td>
                      <Td>{formatMoney(a.fee)}</Td>
                      <Td>{formatMoney(balance(a.fee, paid))}</Td>
                      <Td><StatusBadge status={paymentStatus(a.fee, paid)} /></Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
