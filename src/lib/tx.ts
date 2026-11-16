import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type Tx = Prisma.TransactionClient;

/** SQLite allows a single writer. If two transactions collide the loser fails cleanly; retry it a few times. */
export async function withTransaction<T>(fn: (tx: Tx) => Promise<T>, attempts = 4): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await db.$transaction(fn);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      const retryable = /SQLITE_BUSY|database is locked|snapshot|Transaction API error|write conflict/i.test(msg);
      if (!retryable || i >= attempts) throw e;
      await new Promise((r) => setTimeout(r, 40 * i + Math.random() * 60));
    }
  }
}

/** Next human-friendly sequence number. Call inside a transaction; the UNIQUE index guards against duplicates. */
export async function nextAdmissionNumber(tx: Tx): Promise<number> {
  const { _max } = await tx.admission.aggregate({ _max: { number: true } });
  return (_max.number ?? 0) + 1;
}

export async function nextPaymentNumber(tx: Tx): Promise<number> {
  const { _max } = await tx.payment.aggregate({ _max: { number: true } });
  return (_max.number ?? 0) + 1;
}

export async function nextApplicationNumber(tx: Tx): Promise<number> {
  const { _max } = await tx.application.aggregate({ _max: { number: true } });
  return (_max.number ?? 0) + 1;
}
