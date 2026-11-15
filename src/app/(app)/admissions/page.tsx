import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { SearchBox } from "@/components/search-box";
import { Card, EmptyState, PageHeader, Pagination, StatusBadge, Table, Td, Th, ButtonLink, buttonClass } from "@/components/ui";
import { db } from "@/lib/db";
import { admissionNo, formatDate } from "@/lib/format";
import { formatMoney, type PaymentStatus } from "@/lib/finance";
import { PAGE_SIZE, searchAdmissions } from "@/lib/queries";

export const metadata: Metadata = { title: "Admissions" };
export const dynamic = "force-dynamic";

type Params = { q?: string; status?: string; course?: string; from?: string; to?: string; page?: string };
const STATUSES = ["PENDING", "PARTIAL", "PAID"];

export default async function Admissions({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const page = Math.max(Number(sp.page) || 1, 1);
  const filters = {
    q: sp.q,
    status: (STATUSES.includes(sp.status ?? "") ? sp.status : "") as PaymentStatus | "",
    courseId: sp.course,
    from: sp.from,
    to: sp.to,
  };
  const [{ rows, total }, courses] = await Promise.all([searchAdmissions(filters, page), db.course.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })]);
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const active = Object.entries({ q: sp.q, status: filters.status, course: sp.course, from: sp.from, to: sp.to }).filter(([, v]) => v) as [string, string][];
  const qs = new URLSearchParams(active);

  const field = "h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

  return (
    <>
      <PageHeader
        title="Admissions"
        description={`${total} ${total === 1 ? "record" : "records"}${active.length ? " match your filters" : ""}.`}
        actions={
          <>
            <a href={`/api/admissions/export?${qs}`} className={buttonClass("secondary")}><Download className="size-4" aria-hidden="true" /> Export CSV</a>
            <ButtonLink href="/admissions/new">New admission</ButtonLink>
          </>
        }
      />
      <Card>
        <form className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-6" role="search">
          <div className="sm:col-span-2"><SearchBox bare placeholder="Student name, email, phone or ADM number" defaultValue={sp.q} /></div>
          <select name="status" defaultValue={filters.status} aria-label="Payment status" className={field}>
            <option value="">All payments</option>
            <option value="PENDING">Unpaid</option>
            <option value="PARTIAL">Partially paid</option>
            <option value="PAID">Paid in full</option>
          </select>
          <select name="course" defaultValue={sp.course ?? ""} aria-label="Course" className={field}>
            <option value="">All courses</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" name="from" defaultValue={sp.from} aria-label="From date" className={field} />
          <div className="flex gap-2">
            <input type="date" name="to" defaultValue={sp.to} aria-label="To date" className={`${field} min-w-0 flex-1`} />
            <button className={buttonClass("primary")}>Apply</button>
          </div>
        </form>
        {active.length > 0 && (
          <div className="border-b border-slate-100 px-4 py-2 text-sm"><Link href="/admissions" className="text-brand-600 hover:underline">Clear all filters</Link></div>
        )}
        {rows.length === 0 ? (
          <EmptyState title="No admissions found" description={active.length ? "No record matches these filters." : "Create an admission to get started."} action={<ButtonLink href="/admissions/new">New admission</ButtonLink>} />
        ) : (
          <Table>
            <thead><tr><Th>No.</Th><Th>Student</Th><Th>Course</Th><Th>Date</Th><Th>Fee</Th><Th>Balance</Th><Th>Status</Th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <Td><Link href={`/admissions/${a.id}`} className="font-medium text-brand-600 hover:underline">{admissionNo(a.number)}</Link></Td>
                  <Td><span className="font-medium text-slate-900">{a.student.name}</span><div className="text-xs text-slate-500">{a.student.email}</div></Td>
                  <Td>{a.course.name}</Td>
                  <Td>{formatDate(a.admissionDate)}</Td>
                  <Td>{formatMoney(a.fee)}</Td>
                  <Td>{formatMoney(a.balance)}</Td>
                  <Td><StatusBadge status={a.status} /></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination page={page} pages={pages} hrefFor={(p) => `/admissions?${new URLSearchParams([...active, ["page", String(p)]])}`} />
      </Card>
    </>
  );
}
