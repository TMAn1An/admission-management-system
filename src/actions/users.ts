"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseForm, userSchema, type ActionState } from "@/lib/validation";

export async function createUser(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(userSchema, formData);
  if (parsed.error) return parsed.error;
  const { password, ...rest } = parsed.data;
  try {
    await db.user.create({ data: { ...rest, passwordHash: await bcrypt.hash(password, 12) } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        message: "Please fix the highlighted fields.",
        fieldErrors: { email: ["A user with this email already exists"] },
        values: { name: rest.name, email: rest.email, role: rest.role },
      };
    }
    throw e;
  }
  revalidatePath("/users");
  return { ok: true, message: `${rest.name} can now sign in.` };
}

export async function toggleUserActive(id: string) {
  const admin = await requireAdmin();
  if (admin.id === id) return; // never lock yourself out
  const user = await db.user.findUnique({ where: { id }, select: { active: true } });
  if (!user) return;
  await db.user.update({ where: { id }, data: { active: !user.active } });
  revalidatePath("/users");
}
