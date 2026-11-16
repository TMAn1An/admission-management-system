import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { isValidPayment } = await import("./gateway");

const attempt = { tranId: "tx_1", amount: "5000.00" };

describe("isValidPayment", () => {
  it("accepts a validated BDT payment of the exact amount", () => {
    expect(isValidPayment(attempt, { status: "VALID", tran_id: "tx_1", currency_type: "BDT", currency_amount: "5000.00" })).toBe(true);
    expect(isValidPayment(attempt, { status: "VALIDATED", tran_id: "tx_1", amount: "5000.00" })).toBe(true);
  });
  it("rejects wrong amount, wrong transaction, failed status or foreign currency", () => {
    expect(isValidPayment(attempt, { status: "VALID", tran_id: "tx_1", amount: "4999.99" })).toBe(false);
    expect(isValidPayment(attempt, { status: "VALID", tran_id: "other", amount: "5000.00" })).toBe(false);
    expect(isValidPayment(attempt, { status: "FAILED", tran_id: "tx_1", amount: "5000.00" })).toBe(false);
    expect(isValidPayment(attempt, { status: "VALID", tran_id: "tx_1", currency_type: "USD", currency_amount: "5000.00" })).toBe(false);
    expect(isValidPayment(attempt, null)).toBe(false);
  });
});
