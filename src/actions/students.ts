"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseForm, studentSchema, toDate, type ActionState } from "@/lib/validation";

function duplicateEmail(values: Record<string, string>): ActionState {
  return {
    message: "Please fix the highlighted fields.",
    fieldErrors: { email: ["A student with this email already exists"] },
    values,
  };
}

export async function createStudent(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = parseForm(studentSchema, formData);
  if (parsed.error) return parsed.error;

  let id: string;
  try {
    const student = await db.student.create({ data: { ...parsed.data, dob: toDate(parsed.data.dob) } });
    id = student.id;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return duplicateEmail(Object.fromEntries([...formData].map(([k, v]) => [k, String(v)])));
    }
    throw e;
  }
  revalidatePath("/students");
  redirect(`/students/${id}?created=1`);
}

export async function updateStudent(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = parseForm(studentSchema, formData);
  if (parsed.error) return parsed.error;

  try {
    await db.student.update({ where: { id }, data: { ...parsed.data, dob: toDate(parsed.data.dob) } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return duplicateEmail(Object.fromEntries([...formData].map(([k, v]) => [k, String(v)])));
    }
    throw e;
  }
  revalidatePath("/students");
  redirect(`/students/${id}?updated=1`);
}
