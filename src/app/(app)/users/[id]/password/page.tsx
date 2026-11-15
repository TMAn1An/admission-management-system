import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resetUserPassword } from "@/actions/account";
import { ActionForm, SubmitButton, TextField } from "@/components/form";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPassword({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const user = await db.user.findUnique({ where: { id }, select: { id: true, name: true, email: true } });
  if (!user || user.id === admin.id) notFound();
  return (
    <>
      <PageHeader title={`Reset password for ${user.name}`} description={`${user.email} will be signed out on every device. Share the new password securely.`} />
      <Card className="max-w-xl">
        <ActionForm action={resetUserPassword.bind(null, id)} className="space-y-4 p-5">
          <TextField name="newPassword" label="New temporary password" type="password" autoComplete="new-password" required hint="At least 10 characters." />
          <div className="flex gap-3">
            <SubmitButton pending="Resetting…">Reset password</SubmitButton>
            <ButtonLink href="/users" variant="secondary">Back to team</ButtonLink>
          </div>
        </ActionForm>
      </Card>
    </>
  );
}
