import "server-only";
import { headers } from "next/headers";

/** Optional integrations switch on only when their credentials are present; the UI hides them otherwise. */
/** MAIL_TRANSPORT=log prints emails to the server log; development only. */
export const mailLogOnly = () => process.env.MAIL_TRANSPORT === "log" && process.env.NODE_ENV !== "production";

export const mailEnabled = () => Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM) || mailLogOnly();

export const paymentsEnabled = () =>
  Boolean(process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASSWORD) || paymentsMock();

/** Simulated gateway for local development and tests only. Never active in production. */
export const paymentsMock = () => process.env.PAYMENT_MOCK === "true" && process.env.NODE_ENV !== "production";

export const institutionName = () => process.env.INSTITUTION_NAME || "Admission Office";

export async function baseUrl(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}
