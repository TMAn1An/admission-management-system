"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BookOpen, ClipboardList, GraduationCap, LayoutDashboard, LogOut, Menu, UserCog, Users, X } from "lucide-react";
import { logout } from "@/actions/auth";
import { initials } from "@/lib/format";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/admissions", label: "Admissions", icon: ClipboardList },
  { href: "/users", label: "Team", icon: UserCog, adminOnly: true },
];

export function AppShell({ user, children }: { user: { name: string; email: string; role: "ADMIN" | "STAFF" }; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((i) => !i.adminOnly || user.role === "ADMIN");

  const nav = (
    <nav aria-label="Main" className="flex-1 space-y-1 px-3 py-4">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
      <span className="grid size-9 place-items-center rounded-lg bg-brand-600 text-white">
        <GraduationCap className="size-5" aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-slate-900">Admissions</span>
        <span className="block text-xs text-slate-500">Management System</span>
      </span>
    </Link>
  );

  const account = (
    <div className="border-t border-slate-200 p-4">
      <Link
        href="/account"
        onClick={() => setOpen(false)}
        aria-current={pathname === "/account" ? "page" : undefined}
        className={clsx("-m-2 flex items-center gap-3 rounded-lg p-2 hover:bg-slate-100", pathname === "/account" && "bg-brand-50")}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">{initials(user.name)}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
          <p className="truncate text-xs text-slate-500">{user.role === "ADMIN" ? "Administrator" : "Staff"} · Account</p>
        </div>
      </Link>
      <form action={logout} className="mt-3">
        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
          <LogOut className="size-4" aria-hidden="true" /> Sign out
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        {brand}
        {nav}
        {account}
      </aside>

      <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
          <GraduationCap className="size-5 text-brand-600" aria-hidden="true" /> Admissions
        </Link>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-slate-100">
          <Menu className="size-5" />
        </button>
      </header>

      {open && (
        <div className="no-print fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 rounded-lg p-2 hover:bg-slate-100">
              <X className="size-5" />
            </button>
            {brand}
            {nav}
            {account}
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
