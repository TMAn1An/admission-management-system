import "server-only";
import { db } from "@/lib/db";
import { withTransaction } from "@/lib/tx";

export type LimitResult = { ok: boolean; retryAfter: number };

/** Count one event for `key`. Returns ok=false once more than `limit` events happen inside the window. */
export async function hit(key: string, limit: number, windowSeconds: number): Promise<LimitResult> {
  return withTransaction(async (tx) => {
    const now = new Date();
    const row = await tx.rateLimit.findUnique({ where: { key } });
    if (!row || row.resetAt <= now) {
      const resetAt = new Date(now.getTime() + windowSeconds * 1000);
      await tx.rateLimit.upsert({ where: { key }, create: { key, count: 1, resetAt }, update: { count: 1, resetAt } });
      return { ok: true, retryAfter: 0 };
    }
    if (row.count >= limit) return { ok: false, retryAfter: Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000) };
    await tx.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    return { ok: true, retryAfter: 0 };
  });
}

/** Check without counting (used to block a login before verifying the password). */
export async function isBlocked(key: string, limit: number): Promise<LimitResult> {
  const row = await db.rateLimit.findUnique({ where: { key } });
  if (!row || row.resetAt <= new Date() || row.count < limit) return { ok: true, retryAfter: 0 };
  return { ok: false, retryAfter: Math.ceil((row.resetAt.getTime() - Date.now()) / 1000) };
}

export async function clearLimit(key: string) {
  await db.rateLimit.deleteMany({ where: { key } });
}

export const waitMessage = (seconds: number) =>
  `Too many attempts. Please try again in ${seconds >= 120 ? `${Math.ceil(seconds / 60)} minutes` : `${Math.max(seconds, 1)} seconds`}.`;
