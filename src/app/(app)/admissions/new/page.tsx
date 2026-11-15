import type { Metadata } from "next";
import { createAdmission } from "@/actions/admissions";
import { ActionForm, SelectField, SubmitButton, TextField } from "@/components/form";
import { Card, PageHeader, ButtonLink, Notice } from "@/components/ui";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/finance";
import { todayInput } from "@/lib/format";

export const metadata: Metadata = { title: "New admission" };
export const dynamic = "force-dynamic";

export default async function NewAdmission({ searchParams }: { searchParams: Promise<{ studentId?: string; courseId?: string }> }) {
  const sp = await searchParams;
  const [students, courses] = await Promise.all([
    db.student.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true } }),
    db.course.findMany({ where: { active: true }, orderBy: { name: "asc" }, include: { _count: { select: { admissions: true } } } }),
  ]);
  const open = courses.filter((c) => c.capacity === null || c._count.admissions < c.capacity);

  if (students.length === 0 || open.length === 0) {
    return (
      <>
        <PageHeader title="New admission" />
        <Notice tone="info">
          {students.length === 0 ? "Register a student before creating an admission." : "No course currently has open seats. Add or reopen a course first."}
        </Notice>
        <ButtonLink href={students.length === 0 ? "/students/new" : "/courses"}>{students.length === 0 ? "Register student" : "Go to courses"}</ButtonLink>
      </>
    );
  }

  return (
    <>
      <PageHeader title="New admission" description="Admit a student to a course. The course fee is locked in at today's rate." />
      <Card className="max-w-3xl p-6">
        <ActionForm action={createAdmission} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField name="studentId" label="Student" required placeholder="Select a student" defaultValue={sp.studentId} options={students.map((s) => ({ value: s.id, label: `${s.name} — ${s.email}` }))} />
            <SelectField
              name="courseId"
              label="Course"
              required
              placeholder="Select a course"
              defaultValue={sp.courseId}
              options={open.map((c) => ({ value: c.id, label: `${c.name} — ${formatMoney(c.fee)}${c.capacity !== null ? ` (${c.capacity - c._count.admissions} seats left)` : ""}` }))}
            />
            <TextField name="admissionDate" label="Admission date" type="date" required defaultValue={todayInput()} />
            <div />
            <TextField name="initialPayment" label="Initial payment (৳)" type="number" step="0.01" min="0" inputMode="decimal" hint="Optional. Record a first payment now, or add payments later." />
            <SelectField
              name="method"
              label="Payment method"
              defaultValue="CASH"
              options={[{ value: "CASH", label: "Cash" }, { value: "CARD", label: "Card" }, { value: "ONLINE", label: "Online" }, { value: "CHEQUE", label: "Cheque" }]}
            />
          </div>
          <div className="flex gap-3 border-t border-slate-100 pt-5">
            <SubmitButton>Create admission</SubmitButton>
            <ButtonLink href="/admissions" variant="secondary">Cancel</ButtonLink>
          </div>
        </ActionForm>
      </Card>
    </>
  );
}
