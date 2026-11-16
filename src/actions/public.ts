"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { baseUrl, clientIp, paymentsEnabled, paymentsMock } from "@/lib/config";
import { initSession } from "@/lib/gateway";
import { sendMail, sign_off } from "@/lib/mail";
import { createAttempt, failAttempt, settleAttempt } from "@/lib/online-payments";
import { hit, waitMessage } from "@/lib/ratelimit";
import { applicationNo } from "@/lib/refs";
import { formTokenAgeSeconds, signValue, verifyValue } from "@/lib/tokens";
import { nextApplicationNumber, withTransaction } from "@/lib/tx";
import { applicationSchema, lookupSchema, onlinePaySchema, parseForm, toDate, type ActionState } from "@/lib/validation";

const STATUS_COOKIE = "ams_status";

export async function submitApplication(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(applicationSchema, formData);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  // Bots: filled honeypot, missing/forged token, or a form "submitted" in under 3 seconds. Pretend success.
  const age = formTokenAgeSeconds(d.ft);
  if (d.website || age === null || age < 3) redirect("/apply/received?ref=APP-000000");

  const ip = await clientIp();
  const limit = await hit(`apply:${ip}`, 5, 60 * 60);
  if (!limit.ok) return { message: waitMessage(limit.retryAfter), values: parsed.error ? {} : undefined };

  const course = await db.course.findUnique({ where: { id: d.courseId }, include: { _count: { select: { admissions: true } } } });
  const full = course && course.capacity !== null && course._count.admissions >= course.capacity;
  if (!course || !course.active || full) {
    return { message: "Please fix the highlighted fields.", fieldErrors: { courseId: ["This course is not open for applications"] }, values: toValues(formData) };
  }

  const duplicate = await db.application.findFirst({ where: { email: d.email, courseId: d.courseId, status: "PENDING" } });
  if (duplicate) {
    return {
      message: "Please fix the highlighted fields.",
      fieldErrors: { email: [`You already have a pending application for this course (${applicationNo(duplicate.number)}). Use “Check status” to follow it.`] },
      values: toValues(formData),
    };
  }

  const app = await withTransaction(async (tx) =>
    tx.application.create({
      data: {
        number: await nextApplicationNumber(tx),
        name: d.name,
        email: d.email,
        phone: d.phone,
        address: d.address,
        dob: toDate(d.dob),
        courseId: d.courseId,
        message: d.message || null,
      },
    }),
  );

  const url = `${await baseUrl()}/status`;
  await sendMail({
    to: d.email,
    subject: `Application received — ${applicationNo(app.number)}`,
    text: `Dear ${d.name},\n\nThank you for applying to ${course.name}.\nYour application number is ${applicationNo(app.number)}. Keep it safe: you need it together with this email address to check your status.\n\nCheck status: ${url}${sign_off()}`,
  });
  redirect(`/apply/received?ref=${applicationNo(app.number)}`);
}

const toValues = (fd: FormData) =>
  Object.fromEntries([...fd].filter(([k, v]) => typeof v === "string" && !["ft", "website"].includes(k)).map(([k, v]) => [k, String(v)]));

export async function lookupStatus(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(lookupSchema, formData);
  if (parsed.error) return parsed.error;

  const ip = await clientIp();
  const limit = await hit(`lookup:${ip}`, 10, 15 * 60);
  if (!limit.ok) return { message: waitMessage(limit.retryAfter) };

  const app = await db.application.findUnique({ where: { number: parsed.data.ref } });
  // Same answer for "no such number" and "wrong email" so numbers cannot be probed.
  if (!app || app.email !== parsed.data.email) {
    return { message: "We could not find an application with that number and email. Check both and try again.", values: { ref: String(formData.get("ref") ?? ""), email: parsed.data.email } };
  }
  const store = await cookies();
  store.set(STATUS_COOKIE, signValue(app.id, 30 * 60), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 30 * 60 });
  redirect(`/status/${app.number}`);
}

/** The signed cookie set after a successful lookup is the only credential for the status page. */
export async function getStatusApplication(number: number) {
  const store = await cookies();
  const id = verifyValue(store.get(STATUS_COOKIE)?.value);
  if (!id) return null;
  const app = await db.application.findUnique({ where: { id }, include: { course: true } });
  return app && app.number === number ? app : null;
}

export async function startOnlinePayment(applicationNumber: number, _: ActionState, formData: FormData): Promise<ActionState> {
  if (!paymentsEnabled()) return { message: "Online payment is not available right now." };
  const app = await getStatusApplication(applicationNumber);
  if (!app?.admissionId) return { message: "Please look up your application again." };
  const parsed = parseForm(onlinePaySchema, formData);
  if (parsed.error) return parsed.error;

  const limit = await hit(`pay:${await clientIp()}`, 10, 60 * 60);
  if (!limit.ok) return { message: waitMessage(limit.retryAfter) };

  const created = await createAttempt(app.admissionId, parsed.data.amount, app.email);
  if (!("attempt" in created)) return { message: "Please fix the highlighted fields.", fieldErrors: { amount: [created.error] }, values: { amount: String(parsed.data.amount) } };
  const { attempt } = created;

  if (paymentsMock()) redirect(`/pay/mock?tran=${attempt.tranId}`);

  const session = await initSession({
    tranId: attempt.tranId,
    amount: parsed.data.amount,
    name: app.name,
    email: app.email,
    phone: app.phone,
    address: app.address,
    baseUrl: await baseUrl(),
  });
  if ("error" in session) {
    await failAttempt(attempt.tranId, "FAILED");
    return { message: `${session.error} You have not been charged.` };
  }
  redirect(session.url);
}

/** Development-only: completes or fails an attempt without a real gateway, through the same settlement code. */
export async function mockGatewayOutcome(tranId: string, outcome: "success" | "fail") {
  if (!paymentsMock()) throw new Error("Mock gateway is disabled.");
  if (outcome === "success") await settleAttempt(tranId, `MOCK-${tranId}`);
  else await failAttempt(tranId, "FAILED");
  redirect(`/pay/result?tran=${tranId}`);
}
