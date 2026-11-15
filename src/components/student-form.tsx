import { ActionForm, SubmitButton, TextArea, TextField } from "@/components/form";
import { ButtonLink } from "@/components/ui";
import type { ActionState } from "@/lib/validation";

type Values = { name?: string; email?: string; phone?: string; address?: string; dob?: string };

export function StudentForm({ action, initial = {}, cancelHref }: { action: (s: ActionState, f: FormData) => Promise<ActionState>; initial?: Values; cancelHref: string }) {
  return (
    <ActionForm action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="name" label="Full name" defaultValue={initial.name} required autoComplete="off" className="sm:col-span-2" />
        <TextField name="email" label="Email" type="email" defaultValue={initial.email} required hint="Used to prevent duplicate registrations." />
        <TextField name="phone" label="Phone" type="tel" defaultValue={initial.phone} required placeholder="+8801XXXXXXXXX" />
        <TextField name="dob" label="Date of birth" type="date" defaultValue={initial.dob} required />
        <TextArea name="address" label="Address" defaultValue={initial.address} required className="sm:col-span-2" />
      </div>
      <div className="flex gap-3 border-t border-slate-100 pt-5">
        <SubmitButton>Save student</SubmitButton>
        <ButtonLink href={cancelHref} variant="secondary">Cancel</ButtonLink>
      </div>
    </ActionForm>
  );
}
