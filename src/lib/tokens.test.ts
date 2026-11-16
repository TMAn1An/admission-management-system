import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-12345";
});

describe("signed values", () => {
  it("round-trips and rejects tampering", async () => {
    const { signValue, verifyValue } = await import("./tokens");
    const token = signValue("app_123", 60);
    expect(verifyValue(token)).toBe("app_123");
    const [body, sig] = token.split(".");
    expect(verifyValue(`${body}.${sig!.slice(0, -2)}xx`)).toBeNull();
    expect(verifyValue(`${Buffer.from("other|9999999999999").toString("base64url")}.${sig}`)).toBeNull();
    expect(verifyValue("garbage")).toBeNull();
    expect(verifyValue(undefined)).toBeNull();
  });
  it("rejects expired values", async () => {
    const { signValue, verifyValue } = await import("./tokens");
    expect(verifyValue(signValue("x", -1))).toBeNull();
  });
  it("reports form age for the anti-bot check", async () => {
    const { formToken, formTokenAgeSeconds } = await import("./tokens");
    const age = formTokenAgeSeconds(formToken());
    expect(age).not.toBeNull();
    expect(age!).toBeLessThan(2);
    expect(formTokenAgeSeconds("forged.token")).toBeNull();
  });
  it("hashes reset tokens deterministically and never stores the raw token", async () => {
    const { newResetToken, hashToken } = await import("./tokens");
    const { token, hash } = newResetToken();
    expect(hash).toBe(hashToken(token));
    expect(hash).not.toContain(token);
    expect(newResetToken().token).not.toBe(token);
  });
});
