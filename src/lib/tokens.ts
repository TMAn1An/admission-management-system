import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set and at least 32 characters long.");
  return s;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

/** `<payload>.<signature>`; verify returns the payload only when the signature matches and it has not expired. */
export function signValue(payload: string, ttlSeconds: number): string {
  const body = `${payload}|${Date.now() + ttlSeconds * 1000}`;
  return `${Buffer.from(body).toString("base64url")}.${sign(body)}`;
}

export function verifyValue(token: string | undefined | null): string | null {
  if (!token) return null;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;
  const body = Buffer.from(b64, "base64url").toString();
  const expected = sign(body);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const i = body.lastIndexOf("|");
  if (i < 0 || Number(body.slice(i + 1)) < Date.now()) return null;
  return body.slice(0, i);
}

/** Anti-bot token for public forms: embeds the render time so instant (scripted) submissions can be refused. */
export const formToken = () => signValue(String(Date.now()), 2 * 60 * 60);

export function formTokenAgeSeconds(token: string | undefined | null): number | null {
  const v = verifyValue(token);
  return v === null ? null : (Date.now() - Number(v)) / 1000;
}

export function newResetToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
