import { describe, expect, it } from "vitest";
import { balance, paymentStatus, sumDecimals, toMinor } from "./finance";

describe("paymentStatus", () => {
  it("is pending when nothing is paid", () => {
    expect(paymentStatus(50000, 0)).toBe("PENDING");
  });
  it("is partial when some is paid", () => {
    expect(paymentStatus("50000.00", "20000.00")).toBe("PARTIAL");
  });
  it("is paid when fully paid or overpaid", () => {
    expect(paymentStatus(50000, 50000)).toBe("PAID");
    expect(paymentStatus(50000, 50000.01)).toBe("PAID");
  });
});

describe("money helpers", () => {
  it("avoids floating point drift", () => {
    expect(sumDecimals([0.1, 0.2])).toBe(0.3);
    expect(toMinor("19.99")).toBe(1999);
  });
  it("never returns a negative balance", () => {
    expect(balance(100, 150)).toBe(0);
    expect(balance(100, 40.5)).toBe(59.5);
  });
});
