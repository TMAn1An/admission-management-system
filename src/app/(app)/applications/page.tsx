import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, Pagination, Table, Td, Th } from "@/components/ui";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { applicationNo } from "@/lib/refs";
import { PAGE_SIZE } from "@/lib/queries";

export const metadata: Metadata = { title: "Applications" };
export const dynamic = "force-dynamic";

const TABS = [["PENDING", "Pending"], ["APPROVED", "Approved"], ["REJECTED", "Rejected"], ["", "All"]] as const;
const TONE = { PENDING: "brand", APPROVED: "green", REJECTED: "red" } as const;

export default async function Applications({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const sp = await searchParams;
  const status = (["PENDING", "APPROVED", "REJECTED"].includes(sp.status ?? "") ? sp.status : sp.status === "ALL" ? "" : "PENDING") as "PENDING" | "APPROVED" | "REJECTED" | "";
  const page = Math.max(Number(sp.page) || 1, 1);
  const where = status ? { status } : {};
  const [rows, total, counts] = await Promise.all([
    db.application.findMany({ where, orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { course: { select: { name: true } } } }),
    db.application.count({ where }),
    db.application.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const href = (s: string, p = 1) => `/applications?status=${s || "ALL"}&page=${p}`;

  return (
    <>
      <PageHeader title="Applications" description="Online applications from prospective students. Approving one creates the student and the admission." />
      <Card>
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 pt-2" role="tablist">
          {TABS.map(([v, label]) => (
            <Link key={label} href={href(v)} role="tab" aria-selected={status === v} className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${status === v ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
              {label}{v ? ` (${count(v)})` : ""}
            </Link>
          ))}
        </div>
        {rows.length === 0 ? (
          <EmptyState title="Nothing here" description={status === "PENDING" ? "No applications are waiting for review." : "No applications match this view."} />
        ) : (
          <Table>
            <thead><tr><Th>No.</Th><Th>Applicant</Th><Th>Course</Th><Th>Submitted</Th><Th>Status</Th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <Td><Link href={`/applications/${a.id}`} className="font-medium text-brand-600 hover:underline">{applicationNo(a.number)}</Link></Td>
                  <Td><span className="font-medium text-slate-900">{a.name}</span><div className="text-xs text-slate-500">{a.email}</div></Td>
                  <Td>{a.course.name}</Td>
                  <Td>{formatDate(a.createdAt)}</Td>
                  <Td><Badge tone={TONE[a.status]}>{a.status.charAt(0) + a.status.slice(1).toLowerCase()}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination page={page} pages={pages} hrefFor={(p) => href(status, p)} />
      </Card>
    </>
  );
}
