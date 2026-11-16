"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { AdmissionError, admitStudent } from "@/lib/admit";
import { withTransaction } from "@/lib/tx";
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
    id = await withTransaction((tx) =>
      admitStudent(tx, { studentId, courseId, date: toDate(admissionDate), initialPayment: initial, method, receivedById: user.id }),
    );
  } catch (e) {
    if (e instanceof AdmissionError) return fail(e.field, e.message);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("studentId", "This student is already admitted to this course");
    }
    throw e;
  }

  revalidatePath("/admissions");
  revalidatePath("/dashboard");
  redirect(`/admissions/${id}?created=1`);
}
