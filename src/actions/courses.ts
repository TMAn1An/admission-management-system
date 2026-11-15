"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { courseSchema, departmentSchema, parseForm, type ActionState } from "@/lib/validation";

const dupName = (values: Record<string, string>): ActionState => ({
  message: "Please fix the highlighted fields.",
  fieldErrors: { name: ["This name is already in use"] },
  values,
});
const toValues = (fd: FormData) => Object.fromEntries([...fd].map(([k, v]) => [k, String(v)]));
const isDuplicate = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

export async function createCourse(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(courseSchema, formData);
  if (parsed.error) return parsed.error;
  try {
    await db.course.create({ data: parsed.data });
  } catch (e) {
    if (isDuplicate(e)) return dupName(toValues(formData));
    throw e;
  }
  revalidatePath("/courses");
  redirect("/courses?saved=1");
}

export async function updateCourse(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(courseSchema, formData);
  if (parsed.error) return parsed.error;
  try {
    await db.course.update({ where: { id }, data: parsed.data });
  } catch (e) {
    if (isDuplicate(e)) return dupName(toValues(formData));
    throw e;
  }
  revalidatePath("/courses");
  redirect("/courses?saved=1");
}

export async function toggleCourseActive(id: string) {
  await requireAdmin();
  const course = await db.course.findUnique({ where: { id }, select: { active: true } });
  if (!course) return;
  await db.course.update({ where: { id }, data: { active: !course.active } });
  revalidatePath("/courses");
}

export async function createDepartment(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(departmentSchema, formData);
  if (parsed.error) return parsed.error;
  try {
    await db.department.create({ data: parsed.data });
  } catch (e) {
    if (isDuplicate(e)) return dupName(toValues(formData));
    throw e;
  }
  revalidatePath("/courses");
  return { ok: true, message: "Department added." };
}
