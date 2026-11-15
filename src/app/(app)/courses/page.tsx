import type { Metadata } from "next";
import Link from "next/link";
import { toggleCourseActive } from "@/actions/courses";
import { DepartmentForm } from "@/components/department-form";
import { Badge, Card, CardHeader, EmptyState, Notice, PageHeader, Table, Td, Th, ButtonLink, buttonClass } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/finance";

export const metadata: Metadata = { title: "Courses" };
export const dynamic = "force-dynamic";

export default async function Courses({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [user, { saved }] = await Promise.all([requireUser(), searchParams]);
  const isAdmin = user.role === "ADMIN";
  const [courses, departments] = await Promise.all([
    db.course.findMany({ include: { department: true, _count: { select: { admissions: true } } }, orderBy: [{ active: "desc" }, { name: "asc" }] }),
    db.department.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { courses: true } } } }),
  ]);

  return (
    <>
      <PageHeader title="Courses" description="Programs open for admission, their fees and seat availability." actions={isAdmin && <ButtonLink href="/courses/new">Add course</ButtonLink>} />
      {saved && <Notice>Course saved.</Notice>}
      <Card>
        {courses.length === 0 ? (
          <EmptyState title="No courses yet" description={isAdmin ? "Add a course so students can be admitted." : "Ask an administrator to add courses."} />
        ) : (
          <Table>
            <thead>
              <tr><Th>Course</Th><Th>Department</Th><Th>Duration</Th><Th>Fee</Th><Th>Seats</Th>{isAdmin && <Th><span className="sr-only">Actions</span></Th>}</tr>
            </thead>
            <tbody>
              {courses.map((c) => {
                const full = c.capacity !== null && c._count.admissions >= c.capacity;
                return (
                  <tr key={c.id} className={c.active ? "" : "opacity-60"}>
                    <Td>
                      <span className="font-medium text-slate-900">{c.name}</span>
                      {!c.active && <span className="ml-2"><Badge>Closed</Badge></span>}
                    </Td>
                    <Td>{c.department?.name ?? "—"}</Td>
                    <Td>{c.duration}</Td>
                    <Td>{formatMoney(c.fee)}</Td>
                    <Td>
                      {c._count.admissions}
                      {c.capacity !== null && <span className="text-slate-400"> / {c.capacity}</span>}
                      {full && <span className="ml-2"><Badge tone="red">Full</Badge></span>}
                    </Td>
                    {isAdmin && (
                      <Td>
                        <div className="flex justify-end gap-2">
                          <Link href={`/courses/${c.id}/edit`} className={buttonClass("secondary", "sm")}>Edit</Link>
                          <form action={toggleCourseActive.bind(null, c.id)}>
                            <button className={buttonClass("ghost", "sm")}>{c.active ? "Close" : "Reopen"}</button>
                          </form>
                        </div>
                      </Td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader title="Departments" description={departments.length ? departments.map((d) => `${d.name} (${d._count.courses})`).join(" · ") : "No departments yet."} />
        {isAdmin && <DepartmentForm />}
      </Card>
    </>
  );
}
