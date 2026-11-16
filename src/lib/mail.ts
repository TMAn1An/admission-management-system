import "server-only";
import { institutionName, mailEnabled, mailLogOnly } from "@/lib/config";

type Mail = { to: string; subject: string; text: string };

/**
 * Sends through Resend when RESEND_API_KEY and MAIL_FROM are set. Failures are logged, never thrown:
 * a mail problem must not break an application, approval or payment.
 * With MAIL_TRANSPORT=log (development only) the message is printed to the server log instead.
 */
export async function sendMail({ to, subject, text }: Mail): Promise<boolean> {
  if (mailLogOnly()) {
    console.log(`[mail] to=${to} subject="${subject}"\n${text}\n[/mail]`);
    return true;
  }
  if (!mailEnabled()) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject: `${subject} · ${institutionName()}`, text }),
    });
    if (!res.ok) console.error("[mail] provider error", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("[mail] send failed", e);
    return false;
  }
}

export const sign_off = () => `\n— ${institutionName()}`;
