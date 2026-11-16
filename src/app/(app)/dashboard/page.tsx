import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ClipboardList, Inbox, Users, Wallet } from "lucide-react";
import { Card, CardHeader, EmptyState, Notice, PageHeader, StatusBadge, Table, Td, Th, ButtonLink } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { admissionNo, formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/finance";
import { getDashboard } from "@/lib/queries";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser();
  const { denied } = await searchParams;
  const d = await getDashboard();
  const total = d.byStatus.PAID + d.byStatus.PARTIAL + d.byStatus.PENDING;
  const collectedPct = d.billed > 0 ? Math.round((d.collected / d.billed) * 100) : 0;

  const stats = [
    { label: "Pending applications", value: d.pendingApplications.toLocaleString(), icon: Inbox, href: "/applications" },
    { label: "Students", value: d.students.toLocaleString(), icon: Users },
    { label: "Open courses", value: d.courses.toLocaleString(), icon: BookOpen },
    { label: "Admissions", value: d.admissions.toLocaleString(), icon: ClipboardList },
    { label: "Fees collected", value: formatMoney(d.collected), icon: Wallet },
  ];

  return (
    <>
      <PageHeader
        title={`Hello, ${user.name.split(" ")[0]}`}
        description="Here is what is happening across admissions and fee collection."
        actions={
          <>
            <ButtonLink href="/students/new" variant="secondary">Register student</ButtonLink>
            <ButtonLink href="/admissions/new">New admission</ButtonLink>
          </>
        }
      />
      {denied && <Notice tone="error">You do not have permission to open that page.</Notice>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Card key={label} className="relative p-5">
            {href && <Link href={href} className="absolute inset-0 rounded-card" aria-label={`${label}: view`} />}
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
                <Icon className="size-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent admissions" actions={<Link href="/admissions" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>} />
          {d.recent.length === 0 ? (
            <EmptyState title="No admissions yet" description="Create the first admission to see it here." action={<ButtonLink href="/admissions/new">New admission</ButtonLink>} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th>Course</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {d.recent.map((a) => (
                  <tr key={a.id}>
                    <Td>
                      <Link href={`/admissions/${a.id}`} className="font-medium text-slate-900 hover:text-brand-600">{a.student.name}</Link>
                      <div className="text-xs text-slate-500">{admissionNo(a.number)}</div>
                    </Td>
                    <Td>{a.course.name}</Td>
                    <Td>{formatDate(a.admissionDate)}</Td>
                    <Td><StatusBadge status={a.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Fee collection" description={`${collectedPct}% of ${formatMoney(d.billed)} billed`} />
          <div className="space-y-5 p-5">
            <div
              role="progressbar"
              aria-label="Fees collected"
              aria-valuenow={collectedPct}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2.5 overflow-hidden rounded-full bg-slate-100"
            >
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${collectedPct}%` }} />
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Collected</dt><dd className="font-medium">{formatMoney(d.collected)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Outstanding</dt><dd className="font-medium text-amber-700">{formatMoney(d.outstanding)}</dd></div>
            </dl>
            <div className="border-t border-slate-100 pt-4">
              <p className="mb-3 text-sm font-medium">Admissions by payment</p>
              <ul className="space-y-2 text-sm">
                {([["PAID", "Paid in full"], ["PARTIAL", "Partially paid"], ["PENDING", "Unpaid"]] as const).map(([k, label]) => (
                  <li key={k} className="flex items-center justify-between">
                    <Link href={`/admissions?status=${k}`} className="text-slate-600 hover:text-brand-600">{label}</Link>
                    <span className="font-medium">{d.byStatus[k]}{total ? <span className="ml-1 text-xs font-normal text-slate-400">({Math.round((d.byStatus[k] / total) * 100)}%)</span> : null}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
