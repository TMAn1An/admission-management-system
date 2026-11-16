import Link from "next/link";
import type { ReactNode } from "react";
import { GraduationCap } from "lucide-react";
import { buttonClass } from "@/components/ui";
import { institutionName } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-slate-900">
            <span className="grid size-9 place-items-center rounded-lg bg-brand-600 text-white"><GraduationCap className="size-5" aria-hidden="true" /></span>
            <span className="hidden sm:inline">{institutionName()}</span>
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1 text-sm">
            <Link href="/apply" className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">Apply</Link>
            <Link href="/status" className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">Check status</Link>
            <Link href={user ? "/dashboard" : "/login"} className={buttonClass("secondary", "sm")}>{user ? "Dashboard" : "Staff login"}</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">{children}</main>
      <footer className="no-print border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {institutionName()}
      </footer>
    </div>
  );
}
