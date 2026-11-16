import Link from "next/link";
import { BookOpen, ClipboardCheck, CreditCard } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/finance";
import { institutionName } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function Home() {
  const courses = await db.course.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: { department: true, _count: { select: { admissions: true } } },
  });
  const steps = [
    { icon: BookOpen, title: "1. Choose a course", text: "Browse the programs open for admission below." },
    { icon: ClipboardCheck, title: "2. Apply online", text: "Fill in one short form. You get an application number." },
    { icon: CreditCard, title: "3. Track & pay", text: "Check your status any time, see your slip and pay your fee online." },
  ];
  return (
    <>
      <section className="text-center">
        <h1 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Apply to {institutionName()} in minutes</h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-600">Submit your application online, follow its progress, and pay your fee securely — no queues.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/apply">Apply now</ButtonLink>
          <ButtonLink href="/status" variant="secondary">Check my application</ButtonLink>
        </div>
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-card border border-slate-200 bg-white p-5 shadow-sm">
            <span className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-600"><Icon className="size-5" aria-hidden="true" /></span>
            <h2 className="mt-4 font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{text}</p>
          </div>
        ))}
      </section>

      <section className="mt-14" aria-labelledby="courses-h">
        <h2 id="courses-h" className="text-xl font-semibold">Courses open for admission</h2>
        {courses.length === 0 ? (
          <p className="mt-4 rounded-card border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No courses are open right now. Please check back soon.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {courses.map((c) => {
              const left = c.capacity === null ? null : Math.max(c.capacity - c._count.admissions, 0);
              return (
                <li key={c.id} className="flex flex-col justify-between rounded-card border border-slate-200 bg-white p-5 shadow-sm">
                  <div>
                    <h3 className="font-semibold text-slate-900">{c.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{[c.department?.name, c.duration].filter(Boolean).join(" · ")}</p>
                    <p className="mt-3 text-lg font-semibold text-brand-700">{formatMoney(c.fee)}</p>
                    {left !== null && <p className="mt-1 text-xs text-slate-500">{left === 0 ? "No seats left" : `${left} seats left`}</p>}
                  </div>
                  {left !== 0 && <Link href={`/apply?course=${c.id}`} className="mt-4 text-sm font-medium text-brand-600 hover:underline">Apply for this course →</Link>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
