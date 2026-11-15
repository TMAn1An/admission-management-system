import { describe, expect, it } from "vitest";
import { courseSchema, paymentSchema, studentSchema, userSchema } from "./validation";

const student = { name: "Ayesha Rahman", email: " Ayesha@Example.com ", phone: "+8801711000001", address: "Dhaka", dob: "2002-05-15" };

describe("studentSchema", () => {
  it("normalises email and accepts valid data", () => {
    const r = studentSchema.safeParse(student);
    expect(r.success && r.data.email).toBe("ayesha@example.com");
  });
  it("rejects bad phone, future and implausible birth dates", () => {
    expect(studentSchema.safeParse({ ...student, phone: "abc" }).success).toBe(false);
    expect(studentSchema.safeParse({ ...student, dob: "2999-01-01" }).success).toBe(false);
    expect(studentSchema.safeParse({ ...student, dob: new Date().toISOString().slice(0, 10) }).success).toBe(false);
    expect(studentSchema.safeParse({ ...student, dob: "2002-02-31x" }).success).toBe(false);
  });
});

describe("courseSchema", () => {
  const base = { name: "BSc", duration: "4 Years", fee: "50000", capacity: "", departmentId: "" };
  it("treats empty capacity/department as null (unlimited / none)", () => {
    const r = courseSchema.safeParse(base);
    expect(r.success && [r.data.capacity, r.data.departmentId]).toEqual([null, null]);
  });
  it("rejects non-positive fee and capacity", () => {
    expect(courseSchema.safeParse({ ...base, fee: "0" }).success).toBe(false);
    expect(courseSchema.safeParse({ ...base, capacity: "-3" }).success).toBe(false);
    expect(courseSchema.safeParse({ ...base, capacity: "2.5" }).success).toBe(false);
  });
});

describe("paymentSchema", () => {
  it("requires a positive amount and a known method", () => {
    const ok = { admissionId: "a", amount: "100", paidOn: "2026-01-01", method: "CASH" };
    expect(paymentSchema.safeParse(ok).success).toBe(true);
    expect(paymentSchema.safeParse({ ...ok, amount: "-1" }).success).toBe(false);
    expect(paymentSchema.safeParse({ ...ok, method: "BITCOIN" }).success).toBe(false);
  });
});

describe("userSchema", () => {
  it("enforces a minimum password length", () => {
    const u = { name: "A", email: "a@b.co", password: "short", role: "STAFF" };
    expect(userSchema.safeParse(u).success).toBe(false);
    expect(userSchema.safeParse({ ...u, password: "long-enough-pw" }).success).toBe(true);
  });
});
