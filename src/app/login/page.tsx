import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { login } from "@/actions/auth";
import { ActionForm, SubmitButton, TextField } from "@/components/form";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { mailEnabled } from "@/lib/config";
import { Notice } from "@/components/ui";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const { next, reset } = await searchParams;
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-brand-700 to-brand-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5 text-lg font-semibold">
          <GraduationCap className="size-7" aria-hidden="true" /> Admissions
        </div>
        <div>
          <h2 className="max-w-md text-3xl font-semibold leading-tight">Every student, course and taka — accounted for.</h2>
          <p className="mt-4 max-w-md text-brand-200">
            Register students, confirm admissions, collect fees and print official slips from one secure workspace.
          </p>
        </div>
        <p className="text-sm text-brand-200">Staff access only.</p>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-600">Sign in to manage admissions.</p>
          {reset && <div className="mt-6"><Notice>Password updated. Sign in with your new password.</Notice></div>}
          <ActionForm action={login} className="mt-8 space-y-4" hidden={next ? { next } : undefined}>
            <TextField name="email" label="Email" type="email" autoComplete="email" required autoFocus />
            <TextField name="password" label="Password" type="password" autoComplete="current-password" required />
            <SubmitButton className="w-full" pending="Signing in…">
              Sign in
            </SubmitButton>
          </ActionForm>
          <div className="mt-6 flex items-center justify-between text-sm">
            {mailEnabled() ? <Link href="/forgot-password" className="text-brand-600 hover:underline">Forgot password?</Link> : <span />}
            <Link href="/" className="text-slate-500 hover:underline">← Applicant portal</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
