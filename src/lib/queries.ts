import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { balance, paymentStatus, sumDecimals, type PaymentStatus } from "@/lib/finance";

export const PAGE_SIZE = 12;

export type AdmissionFilters = {
  q?: string;
  status?: PaymentStatus | "";
  courseId?: string;
  from?: string;
  to?: string;
};

const admissionInclude = {
  student: { select: { id: true, name: true, email: true, phone: true } },
  course: { select: { id: true, name: true } },
  payments: { select: { amount: true } },
} satisfies Prisma.AdmissionInclude;

export function admissionWhere(f: AdmissionFilters): Prisma.AdmissionWhereInput {
  const where: Prisma.AdmissionWhereInput = {};
  const q = f.q?.trim();
  if (q) {
    const num = q.replace(/^adm-?/i, "");
    where.OR = [
      { student: { name: { contains: q } } },
      { student: { email: { contains: q } } },
      { student: { phone: { contains: q } } },
      ...(/^\d+$/.test(num) ? [{ number: Number(num) }] : []),
    ];
  }
  if (f.courseId) where.courseId = f.courseId;
  if (f.from || f.to) {
    where.admissionDate = {
      ...(f.from ? { gte: new Date(`${f.from}T00:00:00.000Z`) } : {}),
      ...(f.to ? { lte: new Date(`${f.to}T00:00:00.000Z`) } : {}),
    };
  }
  return where;
}

function decorate<T extends { fee: Prisma.Decimal; payments: { amount: Prisma.Decimal }[] }>(a: T) {
  const paid = sumDecimals(a.payments.map((p) => p.amount));
  return { ...a, paid, balance: balance(a.fee, paid), status: paymentStatus(a.fee, paid) };
}

export async function searchAdmissions(filters: AdmissionFilters, page = 1, pageSize: number | null = PAGE_SIZE) {
  const where = admissionWhere(filters);
  const orderBy = { createdAt: "desc" } as const;

  // Payment status is derived from payments, so filtering by it happens after loading matches.
  if (filters.status || pageSize === null) {
    const all = (await db.admission.findMany({ where, include: admissionInclude, orderBy })).map(decorate);
    const filtered = filters.status ? all.filter((a) => a.status === filters.status) : all;
    if (pageSize === null) return { rows: filtered, total: filtered.length };
    return { rows: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length };
  }

  const [rows, total] = await Promise.all([
    db.admission.findMany({ where, include: admissionInclude, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    db.admission.count({ where }),
  ]);
  return { rows: rows.map(decorate), total };
}

export async function getAdmission(id: string) {
  const admission = await db.admission.findUnique({
    where: { id },
    include: {
      student: true,
      course: { include: { department: true } },
      payments: { orderBy: [{ paidOn: "desc" }, { createdAt: "desc" }], include: { receivedBy: { select: { name: true } } } },
    },
  });
  return admission ? decorate(admission) : null;
}

export async function getDashboard() {
  const [students, courses, admissions, payments, recent, allAdmissions, pendingApplications] = await Promise.all([
    // computed below
    db.student.count(),
    db.course.count({ where: { active: true } }),
    db.admission.count(),
    db.payment.aggregate({ _sum: { amount: true } }),
    db.admission.findMany({ include: admissionInclude, orderBy: { createdAt: "desc" }, take: 6 }),
    db.admission.findMany({ select: { fee: true, payments: { select: { amount: true } } } }),
    db.application.count({ where: { status: "PENDING" } }),
  ]);
  const decorated = allAdmissions.map(decorate);
  const billed = sumDecimals(allAdmissions.map((a) => a.fee));
  const collected = Number(payments._sum.amount ?? 0);
  const byStatus = { PENDING: 0, PARTIAL: 0, PAID: 0 } satisfies Record<PaymentStatus, number>;
  for (const a of decorated) byStatus[a.status]++;
  return { pendingApplications, students, courses, admissions, billed, collected, outstanding: Math.max(billed - collected, 0), byStatus, recent: recent.map(decorate) };
}
