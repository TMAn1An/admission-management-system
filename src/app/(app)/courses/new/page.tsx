import type { Metadata } from "next";
import { createCourse } from "@/actions/courses";
import { CourseForm } from "@/components/course-form";
import { Card, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Add course" };

export default async function NewCourse() {
  await requireAdmin();
  const departments = await db.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <PageHeader title="Add course" />
      <Card className="max-w-3xl p-6"><CourseForm action={createCourse} departments={departments} /></Card>
    </>
  );
}
