import type { Metadata } from "next";
import Link from "next/link";
import { Card, EmptyState, Pagination, PageHeader, Table, Td, Th, ButtonLink } from "@/components/ui";
import { SearchBox } from "@/components/search-box";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { PAGE_SIZE } from "@/lib/queries";

export const metadata: Metadata = { title: "Students" };
export const dynamic = "force-dynamic";

export default async function Students({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q = "", page: pageRaw } = await searchParams;
  const page = Math.max(Number(pageRaw) || 1, 1);
  const term = q.trim();
  const where = term
    ? { OR: [{ name: { contains: term } }, { email: { contains: term } }, { phone: { contains: term } }] }
    : {};
  const [students, total] = await Promise.all([
    db.student.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { _count: { select: { admissions: true } } } }),
    db.student.count({ where }),
  ]);
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <>
      <PageHeader title="Students" description={`${total} registered ${total === 1 ? "student" : "students"}.`} actions={<ButtonLink href="/students/new">Register student</ButtonLink>} />
      <Card>
        <div className="border-b border-slate-100 p-4">
          <SearchBox placeholder="Search by name, email or phone" defaultValue={q} />
        </div>
        {students.length === 0 ? (
          <EmptyState
            title={term ? "No students match your search" : "No students yet"}
            description={term ? "Try a different name, email or phone number." : "Register your first student to get started."}
            action={!term && <ButtonLink href="/students/new">Register student</ButtonLink>}
          />
        ) : (
          <Table>
            <thead>
              <tr><Th>Name</Th><Th>Contact</Th><Th>Admissions</Th><Th>Registered</Th></tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <Td><Link href={`/students/${s.id}`} className="font-medium text-slate-900 hover:text-brand-600">{s.name}</Link></Td>
                  <Td><div>{s.email}</div><div className="text-xs text-slate-500">{s.phone}</div></Td>
                  <Td>{s._count.admissions}</Td>
                  <Td>{formatDate(s.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination page={page} pages={pages} hrefFor={(p) => `/students?${new URLSearchParams({ ...(term ? { q: term } : {}), page: String(p) })}`} />
      </Card>
    </>
  );
}
