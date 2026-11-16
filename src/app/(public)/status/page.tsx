import type { Metadata } from "next";
import { StatusLookup } from "@/components/status-lookup";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Check status" };

export default function Status() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">Check your application</h1>
      <p className="mt-1 text-sm text-slate-600">Enter the number we gave you and the email you applied with.</p>
      <Card className="mt-6 p-6"><StatusLookup /></Card>
    </div>
  );
}
