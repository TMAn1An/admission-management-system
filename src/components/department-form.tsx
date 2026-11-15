"use client";

import { createDepartment } from "@/actions/courses";
import { ActionForm, SubmitButton, TextField } from "@/components/form";

export function DepartmentForm() {
  return (
    <ActionForm action={createDepartment} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
      <TextField name="name" label="Department name" required className="flex-1" />
      <TextField name="head" label="Head of department" className="flex-1" />
      <SubmitButton>Add</SubmitButton>
    </ActionForm>
  );
}
