import type { Metadata } from "next";
import Link from "next/link";
import { findValidResetToken } from "@/actions/password-reset";
import { ResetForm } from "@/components/reset-form";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Choose a new password" };
export const dynamic = "force-dynamic";

export default async function Reset({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = await findValidResetToken(token);
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
      <Card className="mt-6 p-6">
        {valid ? (
          <ResetForm token={token} />
        ) : (
          <p className="text-sm text-slate-700">This reset link is invalid or has expired. <Link href="/forgot-password" className="text-brand-600 hover:underline">Request a new one</Link>.</p>
        )}
      </Card>
    </div>
  );
}
