"use client";

import { createUser } from "@/actions/users";
import { ActionForm, SelectField, SubmitButton, TextField } from "@/components/form";

export function UserForm() {
  return (
    <ActionForm action={createUser} className="grid gap-4 p-5 sm:grid-cols-2">
      <TextField name="name" label="Full name" required />
      <TextField name="email" label="Email" type="email" required />
      <TextField name="password" label="Temporary password" type="password" autoComplete="new-password" required hint="At least 10 characters. Share it securely." />
      <SelectField name="role" label="Role" defaultValue="STAFF" options={[{ value: "STAFF", label: "Staff — students, admissions, payments" }, { value: "ADMIN", label: "Administrator — also courses and team" }]} />
      <div className="sm:col-span-2"><SubmitButton>Add team member</SubmitButton></div>
    </ActionForm>
  );
}
