"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { toMinor } from "@/lib/finance";
import { admissionSchema, parseForm, toDate, type ActionState } from "@/lib/validation";

const toValues = (fd: FormData) => Object.fromEntries([...fd].map(([k, v]) => [k, String(v)]));

export async function createAdmission(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = parseForm(admissionSchema, formData);
  if (parsed.error) return parsed.error;
  const { studentId, courseId, admissionDate } = parsed.data;
  const values = toValues(formData);

  const initialRaw = String(formData.get("initialPayment") ?? "").trim();
  const initial = initialRaw === "" ? 0 : Number(initialRaw);
  const method = String(formData.get("method") ?? "CASH") as "CASH" | "CARD" | "ONLINE" | "CHEQUE";
  if (!Number.isFinite(initial) || initial < 0) {
    return { message: "Please fix the highlighted fields.", fieldErrors: { initialPayment: ["Enter a valid amount"] }, values };
  }

  const fail = (field: string, msg: string): ActionState => ({
    message: "Please fix the highlighted fields.",
    fieldErrors: { [field]: [msg] },
    values,
  });

  let id: string;
  try {
    id = await db.$transaction(async (tx) => {
      // Lock the course row so concurrent admissions cannot exceed its capacity.
      await tx.$queryRaw`SELECT id FROM "Course" WHERE id = ${courseId} FOR UPDATE`;
      const course = await tx.course.findUnique({ where: { id: courseId }, include: { _count: { select: { admissions: true } } } });
      if (!course || !course.active) throw new AdmissionError("courseId", "This course is not open for admission");
      if (course.capacity !== null && course._count.admissions >= course.capacity) {
        throw new AdmissionError("courseId", "This course has no seats left");
      }
      if (toMinor(initial) > toMinor(course.fee)) {
        throw new AdmissionError("initialPayment", "Initial payment is more than the course fee");
      }
      const student = await tx.student.findUnique({ where: { id: studentId }, select: { id: true } });
      if (!student) throw new AdmissionError("studentId", "Student not found");

      const admission = await tx.admission.create({
        data: { studentId, courseId, fee: course.fee, admissionDate: toDate(admissionDate) },
      });
      if (initial > 0) {
        await tx.payment.create({
          data: { admissionId: admission.id, amount: initial, paidOn: toDate(admissionDate), method, receivedById: user.id },
        });
      }
      return admission.id;
    });
  } catch (e) {
    if (e instanceof AdmissionError) return fail(e.field, e.message);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("studentId", "This student is already admitted to this course");
    }
    throw e;
  }

  revalidatePath("/admissions");
  revalidatePath("/");
  redirect(`/admissions/${id}?created=1`);
}

class AdmissionError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message);
  }
}
