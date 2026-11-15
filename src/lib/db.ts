import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

/**
 * Create a Prisma client on the libSQL driver adapter.
 * DATABASE_URL is a Turso URL (libsql://…) in production or a local file (file:./dev.db) for development.
 */
export function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const adapter = new PrismaLibSQL({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
