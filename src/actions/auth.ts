"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { endSession, startSession } from "@/lib/auth";
import { clientIp } from "@/lib/config";
import { clearLimit, hit, isBlocked, waitMessage } from "@/lib/ratelimit";
import { loginSchema, parseForm, type ActionState } from "@/lib/validation";

// Compared against when the email is unknown so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(loginSchema, formData);
  if (parsed.error) return parsed.error;

  // Throttle guessing: 5 failures per email and 20 per IP in 15 minutes.
  const ip = await clientIp();
  const emailKey = `login:email:${parsed.data.email}`;
  const blocked = await isBlocked(emailKey, 5);
  const ipBlocked = await isBlocked(`login:ip:${ip}`, 20);
  if (!blocked.ok || !ipBlocked.ok) {
    return { message: waitMessage(Math.max(blocked.retryAfter, ipBlocked.retryAfter)), values: { email: parsed.data.email } };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const valid = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.active || !valid) {
    await hit(emailKey, 5, 15 * 60);
    await hit(`login:ip:${ip}`, 20, 15 * 60);
    return { message: "Incorrect email or password.", values: { email: parsed.data.email } };
  }

  await clearLimit(emailKey);
  await startSession(user);
  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function logout() {
  await endSession();
  redirect("/login");
}
