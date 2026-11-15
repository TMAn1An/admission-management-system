import { ActionForm, SelectField, SubmitButton, TextField } from "@/components/form";
import { ButtonLink } from "@/components/ui";
import type { ActionState } from "@/lib/validation";

type Initial = { name?: string; duration?: string; fee?: string; capacity?: string; departmentId?: string };

export function CourseForm({ action, departments, initial = {} }: { action: (s: ActionState, f: FormData) => Promise<ActionState>; departments: { id: string; name: string }[]; initial?: Initial }) {
  return (
    <ActionForm action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="name" label="Course name" defaultValue={initial.name} required className="sm:col-span-2" />
        <TextField name="duration" label="Duration" defaultValue={initial.duration} required placeholder="e.g. 4 Years" />
        <TextField name="fee" label="Total fee (৳)" type="number" step="0.01" min="0" inputMode="decimal" defaultValue={initial.fee} required />
        <SelectField name="departmentId" label="Department" defaultValue={initial.departmentId} placeholder="No department" options={departments.map((d) => ({ value: d.id, label: d.name }))} />
        <TextField name="capacity" label="Seat capacity" type="number" min="1" step="1" defaultValue={initial.capacity} hint="Leave empty for unlimited seats." />
      </div>
      <div className="flex gap-3 border-t border-slate-100 pt-5">
        <SubmitButton>Save course</SubmitButton>
        <ButtonLink href="/courses" variant="secondary">Cancel</ButtonLink>
      </div>
    </ActionForm>
  );
}
