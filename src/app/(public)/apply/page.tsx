import type { Metadata } from "next";
import { ApplicationForm } from "@/components/application-form";
import { Card } from "@/components/ui";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/finance";
import { formToken } from "@/lib/tokens";

export const metadata: Metadata = { title: "Apply" };
export const dynamic = "force-dynamic";

export default async function Apply({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const { course } = await searchParams;
  const courses = (
    await db.course.findMany({ where: { active: true }, orderBy: { name: "asc" }, include: { _count: { select: { admissions: true } } } })
  ).filter((c) => c.capacity === null || c._count.admissions < c.capacity);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Apply online</h1>
      <p className="mt-1 text-sm text-slate-600">It takes about two minutes. Staff review every application and we email you the decision.</p>
      <Card className="mt-6 p-6">
        {courses.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No courses are open for applications right now.</p>
        ) : (
          <ApplicationForm
            token={formToken()}
            selected={courses.some((c) => c.id === course) ? course : undefined}
            courses={courses.map((c) => ({ value: c.id, label: `${c.name} — ${formatMoney(c.fee)}` }))}
          />
        )}
      </Card>
    </div>
  );
}
