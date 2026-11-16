"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { baseUrl, clientIp, mailEnabled } from "@/lib/config";
import { sendMail, sign_off } from "@/lib/mail";
import { hit, waitMessage } from "@/lib/ratelimit";
import { hashToken, newResetToken } from "@/lib/tokens";
import { forgotSchema, parseForm, resetPasswordSchema, type ActionState } from "@/lib/validation";

const SENT: ActionState = { ok: true, message: "If an account exists for that email, a reset link is on its way. It expires in 1 hour." };

export async function requestPasswordReset(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!mailEnabled()) return { message: "Email is not configured. Ask an administrator to reset your password." };
  const parsed = parseForm(forgotSchema, formData);
  if (parsed.error) return parsed.error;

  const ip = await clientIp();
  const byIp = await hit(`forgot:ip:${ip}`, 10, 60 * 60);
  const byEmail = await hit(`forgot:email:${parsed.data.email}`, 3, 60 * 60);
  if (!byIp.ok || !byEmail.ok) return { message: waitMessage(Math.max(byIp.retryAfter, byEmail.retryAfter)) };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (user?.active) {
    const { token, hash } = newResetToken();
    await db.passwordResetToken.create({ data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
    await sendMail({
      to: user.email,
      subject: "Reset your password",
      text: `Hello ${user.name},\n\nUse this link to choose a new password (valid for 1 hour, one use):\n${await baseUrl()}/reset-password/${token}\n\nIf you did not ask for this, ignore this email — your password is unchanged.${sign_off()}`,
    });
  }
  // Identical response whether or not the account exists.
  return SENT;
}

export async function findValidResetToken(token: string) {
  const row = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  return row && !row.usedAt && row.expiresAt > new Date() && row.user.active ? row : null;
}

export async function resetPasswordWithToken(token: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(resetPasswordSchema, formData);
  if (parsed.error) return parsed.error;
  if (formData.get("confirmPassword") !== formData.get("newPassword")) {
    return { message: "Please fix the highlighted fields.", fieldErrors: { confirmPassword: ["Passwords do not match"] } };
  }
  const row = await findValidResetToken(token);
  if (!row) return { message: "This reset link is invalid or has expired. Request a new one." };

  await db.$transaction([
    db.user.update({ where: { id: row.userId }, data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12), tokenVersion: { increment: 1 } } }),
    db.passwordResetToken.updateMany({ where: { userId: row.userId, usedAt: null }, data: { usedAt: new Date() } }),
  ]);
  redirect("/login?reset=1");
}
