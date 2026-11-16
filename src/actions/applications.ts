"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AdmissionError, admitStudent } from "@/lib/admit";
import { baseUrl } from "@/lib/config";
import { formatMoney } from "@/lib/finance";
import { admissionNo } from "@/lib/format";
import { sendMail, sign_off } from "@/lib/mail";
import { applicationNo } from "@/lib/refs";
import { withTransaction } from "@/lib/tx";
import type { ActionState } from "@/lib/validation";

const today = () => new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);

/** Approve = create (or reuse) the student and create the admission, in one transaction. */
export async function approveApplication(id: string): Promise<ActionState> {
  const me = await requireUser();
  try {
    const result = await withTransaction(async (tx) => {
      const app = await tx.application.findUnique({ where: { id } });
      if (!app) throw new AdmissionError("", "Application not found.");
      if (app.status !== "PENDING") throw new AdmissionError("", "This application was already reviewed.");

      const student =
        (await tx.student.findUnique({ where: { email: app.email } })) ??
        (await tx.student.create({ data: { name: app.name, email: app.email, phone: app.phone, address: app.address, dob: app.dob } }));

      const existing = await tx.admission.findUnique({ where: { studentId_courseId: { studentId: student.id, courseId: app.courseId } } });
      const admissionId =
        existing?.id ?? (await admitStudent(tx, { studentId: student.id, courseId: app.courseId, date: today(), receivedById: me.id }));

      await tx.application.update({
        where: { id },
        data: { status: "APPROVED", studentId: student.id, admissionId, reviewedById: me.id, reviewedAt: new Date() },
      });
      const admission = await tx.admission.findUniqueOrThrow({ where: { id: admissionId }, include: { course: true } });
      return { app, admission };
    });

    await sendMail({
      to: result.app.email,
      subject: `Admission confirmed — ${admissionNo(result.admission.number)}`,
      text: `Dear ${result.app.name},\n\nCongratulations! Your application ${applicationNo(result.app.number)} for ${result.admission.course.name} has been approved.\nAdmission number: ${admissionNo(result.admission.number)}\nCourse fee: ${formatMoney(result.admission.fee)}\n\nSee your admission slip and payment details: ${await baseUrl()}/status${sign_off()}`,
    });
  } catch (e) {
    if (e instanceof AdmissionError) return { message: e.message };
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { message: "A student or admission with these details already exists." };
    throw e;
  }
  revalidatePath("/applications");
  revalidatePath("/dashboard");
  redirect(`/applications/${id}?approved=1`);
}

export async function rejectApplication(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireUser();
  const note = String(formData.get("note") ?? "").trim();
  if (note.length < 3) return { message: "Please fix the highlighted fields.", fieldErrors: { note: ["Give the applicant a short reason"] }, values: { note } };

  const app = await db.application.findUnique({ where: { id }, include: { course: true } });
  if (!app || app.status !== "PENDING") return { message: "This application was already reviewed." };
  await db.application.update({ where: { id }, data: { status: "REJECTED", reviewNote: note.slice(0, 500), reviewedById: me.id, reviewedAt: new Date() } });

  await sendMail({
    to: app.email,
    subject: `Update on your application ${applicationNo(app.number)}`,
    text: `Dear ${app.name},\n\nThank you for applying to ${app.course.name}. Unfortunately we cannot offer you a place at this time.\n\nReason: ${note}${sign_off()}`,
  });
  revalidatePath("/applications");
  revalidatePath("/dashboard");
  redirect(`/applications/${id}?rejected=1`);
}
