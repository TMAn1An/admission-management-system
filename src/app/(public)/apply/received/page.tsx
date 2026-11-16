import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { ButtonLink, Card } from "@/components/ui";

export const metadata: Metadata = { title: "Application received" };

export default async function Received({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const ref = (await searchParams).ref?.replace(/[^A-Za-z0-9-]/g, "").slice(0, 16) ?? "";
  return (
    <div className="mx-auto max-w-xl text-center">
      <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Application received</h1>
      <p className="mt-2 text-slate-600">Thank you! Staff will review your application and email you the decision.</p>
      {ref && (
        <Card className="mt-6 p-6">
          <p className="text-sm text-slate-500">Your application number</p>
          <p className="mt-1 text-3xl font-semibold tracking-wide text-brand-700">{ref}</p>
          <p className="mt-3 text-sm text-slate-600">Write it down. You need it <strong>with your email address</strong> to check your status.</p>
        </Card>
      )}
      <div className="mt-6 flex justify-center gap-3">
        <ButtonLink href="/status">Check status</ButtonLink>
        <ButtonLink href="/" variant="secondary">Back to home</ButtonLink>
      </div>
    </div>
  );
}
