import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApproveForm } from "@/components/approve-form";
import { RejectForm } from "@/components/reject-form";
import { Badge, Card, CardHeader, Notice, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/finance";
import { admissionNo, formatDate } from "@/lib/format";
import { applicationNo } from "@/lib/refs";

export const metadata: Metadata = { title: "Application" };
export const dynamic = "force-dynamic";

export default async function ApplicationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ approved?: string; rejected?: string }> }) {
  const [{ id }, flags] = await Promise.all([params, searchParams]);
  const app = await db.application.findUnique({ where: { id }, include: { course: { include: { _count: { select: { admissions: true } } } } } });
  if (!app) notFound();
  const [admission, reviewer, existingStudent] = await Promise.all([
    app.admissionId ? db.admission.findUnique({ where: { id: app.admissionId } }) : null,
    app.reviewedById ? db.user.findUnique({ where: { id: app.reviewedById }, select: { name: true } }) : null,
    db.student.findUnique({ where: { email: app.email }, select: { id: true, name: true } }),
  ]);
  const seatsLeft = app.course.capacity === null ? null : app.course.capacity - app.course._count.admissions;
  const tone = { PENDING: "brand", APPROVED: "green", REJECTED: "red" } as const;

  const rows: [string, string][] = [
    ["Name", app.name], ["Email", app.email], ["Phone", app.phone], ["Date of birth", formatDate(app.dob)],
    ["Address", app.address], ["Course", `${app.course.name} — ${formatMoney(app.course.fee)}`], ["Submitted", formatDate(app.createdAt)],
  ];
  return (
    <>
      <PageHeader title={`Application ${applicationNo(app.number)}`} description={`${app.name} · ${app.course.name}`} actions={<Badge tone={tone[app.status]}>{app.status.charAt(0) + app.status.slice(1).toLowerCase()}</Badge>} />
      {flags.approved && <Notice>Approved. The student and admission were created and the applicant was emailed (if email is enabled).</Notice>}
      {flags.rejected && <Notice>Application rejected and the applicant notified.</Notice>}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Applicant" />
          <dl className="grid gap-x-8 gap-y-4 p-5 text-sm sm:grid-cols-2">
            {rows.map(([k, v]) => <div key={k}><dt className="text-slate-500">{k}</dt><dd className="mt-0.5 whitespace-pre-line font-medium">{v}</dd></div>)}
            {app.message && <div className="sm:col-span-2"><dt className="text-slate-500">Note from applicant</dt><dd className="mt-0.5 whitespace-pre-line">{app.message}</dd></div>}
          </dl>
        </Card>
        <Card className="h-fit">
          <CardHeader title="Decision" />
          <div className="space-y-4 p-5 text-sm">
            {app.status === "PENDING" ? (
              <>
                {existingStudent && <p className="rounded-lg bg-sky-50 p-3 text-sky-900">A student with this email already exists ({existingStudent.name}); they will be admitted to this course.</p>}
                {seatsLeft !== null && seatsLeft <= 0 && <p className="rounded-lg bg-amber-50 p-3 text-amber-900">This course has no seats left, so approval will fail until a seat opens.</p>}
                <ApproveForm id={app.id} />
                <div className="border-t border-slate-100 pt-4"><RejectForm id={app.id} /></div>
              </>
            ) : (
              <>
                <p>{app.status === "APPROVED" ? "Approved" : "Rejected"} by {reviewer?.name ?? "staff"}{app.reviewedAt ? ` on ${formatDate(app.reviewedAt)}` : ""}.</p>
                {app.reviewNote && <p className="text-slate-600">Reason: {app.reviewNote}</p>}
                {admission && <Link href={`/admissions/${admission.id}`} className="font-medium text-brand-600 hover:underline">View admission {admissionNo(admission.number)} →</Link>}
              </>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
