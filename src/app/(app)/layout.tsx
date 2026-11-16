import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const pending = await db.application.count({ where: { status: "PENDING" } });
  return <AppShell user={{ name: user.name, email: user.email, role: user.role }} pending={pending}>{children}</AppShell>;
}
