import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { admissionNo } from "@/lib/format";
import { searchAdmissions } from "@/lib/queries";
import type { PaymentStatus } from "@/lib/finance";

export const dynamic = "force-dynamic";

/** Neutralise spreadsheet formula injection and escape CSV special characters. */
function cell(value: string | number): string {
  let s = String(value);
  // Plain phone numbers / numbers (e.g. +8801…) are safe and must stay intact.
  if (/^[=+\-@\t\r]/.test(s) && !/^[+-]?[\d\s()-]+$/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  if (!(await getCurrentUser())) return new NextResponse("Unauthorized", { status: 401 });
  const sp = new URL(request.url).searchParams;
  const status = sp.get("status");
  const { rows } = await searchAdmissions(
    {
      q: sp.get("q") ?? undefined,
      status: (["PENDING", "PARTIAL", "PAID"].includes(status ?? "") ? status : "") as PaymentStatus | "",
      courseId: sp.get("course") ?? undefined,
      from: sp.get("from") ?? undefined,
      to: sp.get("to") ?? undefined,
    },
    1,
    null,
  );
  const header = ["Admission No", "Student", "Email", "Phone", "Course", "Admission Date", "Fee", "Paid", "Balance", "Status"];
  const lines = rows.map((a) =>
    [
      admissionNo(a.number),
      a.student.name,
      a.student.email,
      a.student.phone,
      a.course.name,
      a.admissionDate.toISOString().slice(0, 10),
      Number(a.fee).toFixed(2),
      a.paid.toFixed(2),
      a.balance.toFixed(2),
      a.status,
    ].map(cell).join(","),
  );
  const csv = "﻿" + [header.join(","), ...lines].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="admissions-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
