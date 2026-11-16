import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "@/components/forgot-form";
import { Card } from "@/components/ui";
import { mailEnabled } from "@/lib/config";

export const metadata: Metadata = { title: "Forgot password" };

export default function Forgot() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
      <p className="mt-1 text-sm text-slate-600">Staff accounts only. We will email you a link to choose a new one.</p>
      <Card className="mt-6 p-6">
        {mailEnabled() ? <ForgotForm /> : <p className="text-sm text-slate-600">Email is not set up for this system. Ask an administrator to reset your password from the Team page.</p>}
      </Card>
      <p className="mt-4 text-sm"><Link href="/login" className="text-brand-600 hover:underline">Back to sign in</Link></p>
    </div>
  );
}
