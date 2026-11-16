import "server-only";
import { toMinor } from "@/lib/finance";
import { nextAdmissionNumber, nextPaymentNumber } from "@/lib/tx";
import type { Prisma } from "@prisma/client";

export class AdmissionError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message);
  }
}

type Tx = Prisma.TransactionClient;
type Method = "CASH" | "CARD" | "ONLINE" | "CHEQUE";

/**
 * Creates an admission after checking the course is open, has a free seat, and the optional first payment fits the fee.
 * Must run inside a transaction. Shared by the staff admission form and the application approval flow.
 */
export async function admitStudent(
  tx: Tx,
  input: { studentId: string; courseId: string; date: Date; initialPayment?: number; method?: Method; receivedById?: string | null },
): Promise<string> {
  const { studentId, courseId, date, initialPayment = 0, method = "CASH", receivedById = null } = input;
  const course = await tx.course.findUnique({ where: { id: courseId }, include: { _count: { select: { admissions: true } } } });
  if (!course || !course.active) throw new AdmissionError("courseId", "This course is not open for admission");
  if (course.capacity !== null && course._count.admissions >= course.capacity) {
    throw new AdmissionError("courseId", "This course has no seats left");
  }
  if (toMinor(initialPayment) > toMinor(course.fee)) {
    throw new AdmissionError("initialPayment", "Initial payment is more than the course fee");
  }
  const student = await tx.student.findUnique({ where: { id: studentId }, select: { id: true } });
  if (!student) throw new AdmissionError("studentId", "Student not found");

  const admission = await tx.admission.create({
    data: { number: await nextAdmissionNumber(tx), studentId, courseId, fee: course.fee, admissionDate: date },
  });
  if (initialPayment > 0) {
    await tx.payment.create({
      data: { number: await nextPaymentNumber(tx), admissionId: admission.id, amount: initialPayment, paidOn: date, method, receivedById },
    });
  }
  return admission.id;
}
