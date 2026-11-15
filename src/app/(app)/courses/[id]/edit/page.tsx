import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateCourse } from "@/actions/courses";
import { CourseForm } from "@/components/course-form";
import { Card, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Edit course" };

export default async function EditCourse({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [course, departments] = await Promise.all([
    db.course.findUnique({ where: { id } }),
    db.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!course) notFound();
  return (
    <>
      <PageHeader title={`Edit ${course.name}`} description="Fee changes apply to new admissions only; existing admissions keep the fee they were created with." />
      <Card className="max-w-3xl p-6">
        <CourseForm
          action={updateCourse.bind(null, id)}
          departments={departments}
          initial={{ name: course.name, duration: course.duration, fee: course.fee.toString(), capacity: course.capacity?.toString() ?? "", departmentId: course.departmentId ?? "" }}
        />
      </Card>
    </>
  );
}
