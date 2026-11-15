import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateStudent } from "@/actions/students";
import { StudentForm } from "@/components/student-form";
import { Card, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { toDateInput } from "@/lib/format";

export const metadata: Metadata = { title: "Edit student" };

export default async function EditStudent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await db.student.findUnique({ where: { id } });
  if (!student) notFound();
  return (
    <>
      <PageHeader title={`Edit ${student.name}`} />
      <Card className="max-w-3xl p-6">
        <StudentForm action={updateStudent.bind(null, id)} initial={{ ...student, dob: toDateInput(student.dob) }} cancelHref={`/students/${id}`} />
      </Card>
    </>
  );
}
