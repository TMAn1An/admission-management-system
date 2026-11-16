import { describe, expect, it } from "vitest";
import { applicationSchema, changePasswordSchema, courseSchema, lookupSchema, paymentSchema, studentSchema, userSchema } from "./validation";

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

describe("changePasswordSchema", () => {
  const ok = { currentPassword: "old-password-1", newPassword: "brand-new-pass-9", confirmPassword: "brand-new-pass-9" };
  it("accepts a valid change", () => expect(changePasswordSchema.safeParse(ok).success).toBe(true));
  it("rejects short, mismatched and unchanged passwords", () => {
    expect(changePasswordSchema.safeParse({ ...ok, newPassword: "short", confirmPassword: "short" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ ...ok, confirmPassword: "different-pass-9" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ ...ok, newPassword: ok.currentPassword, confirmPassword: ok.currentPassword }).success).toBe(false);
  });
});

describe("lookupSchema", () => {
  it("accepts APP-000123, app123 and 123, normalising to the number", () => {
    for (const ref of ["APP-000123", "app123", "123", " APP-123 "]) {
      const r = lookupSchema.safeParse({ ref, email: "A@B.co" });
      expect(r.success && [r.data.ref, r.data.email]).toEqual([123, "a@b.co"]);
    }
  });
  it("rejects malformed references and emails", () => {
    expect(lookupSchema.safeParse({ ref: "abc", email: "a@b.co" }).success).toBe(false);
    expect(lookupSchema.safeParse({ ref: "1; DROP", email: "a@b.co" }).success).toBe(false);
    expect(lookupSchema.safeParse({ ref: "1", email: "nope" }).success).toBe(false);
  });
});

describe("applicationSchema", () => {
  const base = { name: "Nadia", email: "n@x.co", phone: "+8801711222333", address: "Dhaka", dob: "2003-02-14", courseId: "c1" };
  it("accepts a normal application and defaults optional fields", () => {
    const r = applicationSchema.safeParse(base);
    expect(r.success && [r.data.message, r.data.website]).toEqual(["", ""]);
  });
  it("rejects a filled honeypot field", () => {
    expect(applicationSchema.safeParse({ ...base, website: "http://spam" }).success).toBe(false);
  });
});
