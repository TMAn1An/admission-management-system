export type PaymentStatus = "PENDING" | "PARTIAL" | "PAID";

type MoneyLike = number | string | { toString(): string };

/** Convert any decimal-like value to integer minor units (paisa) to avoid float drift. */
export function toMinor(value: MoneyLike): number {
  return Math.round(Number(value.toString()) * 100);
}

export function fromMinor(minor: number): number {
  return minor / 100;
}

/** Payment status is derived from payments, never stored, so it cannot go stale. */
export function paymentStatus(fee: MoneyLike, paid: MoneyLike): PaymentStatus {
  const feeMinor = toMinor(fee);
  const paidMinor = toMinor(paid);
  if (paidMinor <= 0) return "PENDING";
  if (paidMinor >= feeMinor) return "PAID";
  return "PARTIAL";
}

export function balance(fee: MoneyLike, paid: MoneyLike): number {
  return fromMinor(Math.max(toMinor(fee) - toMinor(paid), 0));
}

export function sumDecimals(values: MoneyLike[]): number {
  return fromMinor(values.reduce<number>((sum, v) => sum + toMinor(v), 0));
}

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
});

export function formatMoney(value: MoneyLike): string {
  return currency.format(Number(value.toString()));
}

export const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Unpaid",
  PARTIAL: "Partially paid",
  PAID: "Paid in full",
};
