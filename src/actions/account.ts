"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin, requireUser, startSession } from "@/lib/auth";
import { changePasswordSchema, parseForm, resetPasswordSchema, type ActionState } from "@/lib/validation";

export async function changePassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireUser();
  const parsed = parseForm(changePasswordSchema, formData);
  if (parsed.error) return parsed.error;

  const user = await db.user.findUnique({ where: { id: me.id } });
  if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return { message: "Please fix the highlighted fields.", fieldErrors: { currentPassword: ["Current password is incorrect"] } };
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12), tokenVersion: { increment: 1 } },
  });
  // Keep this device signed in with the new session version; every other device is signed out.
  await startSession(updated);
  return { ok: true, message: "Password updated. Other devices have been signed out." };
}

export async function resetUserPassword(userId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  if (admin.id === userId) {
    return { message: "Use “Change password” on your account page to change your own password." };
  }
  const parsed = parseForm(resetPasswordSchema, formData);
  if (parsed.error) return parsed.error;

  const target = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
  if (!target) return { message: "User not found." };
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12), tokenVersion: { increment: 1 } },
  });
  return { ok: true, message: `Password reset for ${target.name}. They were signed out everywhere and must use the new password.` };
}
