import type { Metadata } from "next";
import { changePassword } from "@/actions/account";
import { ActionForm, SubmitButton, TextField } from "@/components/form";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "My account" };

export default async function Account() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="My account" description={`Signed in as ${user.email}`} />
      <Card className="max-w-xl">
        <CardHeader title="Change password" description="You will stay signed in here; every other device is signed out." />
        <ActionForm action={changePassword} className="space-y-4 p-5">
          <TextField name="currentPassword" label="Current password" type="password" autoComplete="current-password" required />
          <TextField name="newPassword" label="New password" type="password" autoComplete="new-password" required hint="At least 10 characters." />
          <TextField name="confirmPassword" label="Repeat new password" type="password" autoComplete="new-password" required />
          <SubmitButton pending="Updating…">Update password</SubmitButton>
        </ActionForm>
      </Card>
    </>
  );
}
