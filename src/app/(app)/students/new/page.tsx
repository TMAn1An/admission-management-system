import type { Metadata } from "next";
import { createStudent } from "@/actions/students";
import { StudentForm } from "@/components/student-form";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Register student" };

export default function NewStudent() {
  return (
    <>
      <PageHeader title="Register student" description="Add a new student record. You can create their admission next." />
      <Card className="max-w-3xl p-6">
        <StudentForm action={createStudent} cancelHref="/students" />
      </Card>
    </>
  );
}
