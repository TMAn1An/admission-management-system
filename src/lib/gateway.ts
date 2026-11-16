import "server-only";
import { toMinor } from "@/lib/finance";

/** SSLCommerz (covers bKash, Nagad, Rocket, cards and net banking in Bangladesh). */
const host = () => (process.env.SSLCOMMERZ_LIVE === "true" ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com");

export type Validation = {
  status?: string;
  tran_id?: string;
  val_id?: string;
  amount?: string;
  currency_type?: string;
  currency_amount?: string;
  bank_tran_id?: string;
  risk_level?: string;
};

export async function initSession(input: {
  tranId: string;
  amount: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  baseUrl: string;
}): Promise<{ url: string } | { error: string }> {
  const body = new URLSearchParams({
    store_id: process.env.SSLCOMMERZ_STORE_ID ?? "",
    store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD ?? "",
    total_amount: input.amount.toFixed(2),
    currency: "BDT",
    tran_id: input.tranId,
    success_url: `${input.baseUrl}/api/pay/sslcommerz/success`,
    fail_url: `${input.baseUrl}/api/pay/sslcommerz/fail`,
    cancel_url: `${input.baseUrl}/api/pay/sslcommerz/cancel`,
    ipn_url: `${input.baseUrl}/api/pay/sslcommerz/ipn`,
    cus_name: input.name,
    cus_email: input.email,
    cus_add1: input.address.slice(0, 80),
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    cus_phone: input.phone,
    shipping_method: "NO",
    product_name: "Admission fee",
    product_category: "Education",
    product_profile: "general",
  });
  try {
    const res = await fetch(`${host()}/gwprocess/v4/api.php`, { method: "POST", body, cache: "no-store" });
    const data = (await res.json()) as { status?: string; GatewayPageURL?: string; failedreason?: string };
    if (data.status === "SUCCESS" && data.GatewayPageURL) return { url: data.GatewayPageURL };
    return { error: data.failedreason || "The payment gateway refused the request." };
  } catch {
    return { error: "Could not reach the payment gateway." };
  }
}

/** Never trust the browser POST: ask the gateway whether this val_id really is a paid transaction. */
export async function validatePayment(valId: string): Promise<Validation | null> {
  const q = new URLSearchParams({
    val_id: valId,
    store_id: process.env.SSLCOMMERZ_STORE_ID ?? "",
    store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD ?? "",
    format: "json",
  });
  try {
    const res = await fetch(`${host()}/validator/api/validationserverAPI.php?${q}`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as Validation) : null;
  } catch {
    return null;
  }
}

/** The validated transaction must be paid, match our transaction id, be in BDT and equal the amount we asked for. */
export function isValidPayment(attempt: { tranId: string; amount: { toString(): string } }, v: Validation | null): boolean {
  if (!v || (v.status !== "VALID" && v.status !== "VALIDATED")) return false;
  if (v.tran_id !== attempt.tranId) return false;
  const currency = v.currency_type ?? "BDT";
  if (currency !== "BDT") return false;
  const paid = v.currency_amount ?? v.amount;
  return paid !== undefined && toMinor(paid) === toMinor(attempt.amount);
}
