"use client";

import { submitApplication } from "@/actions/public";
import { ActionForm, SelectField, SubmitButton, TextArea, TextField } from "@/components/form";

export function ApplicationForm({ courses, token, selected }: { courses: { value: string; label: string }[]; token: string; selected?: string }) {
  return (
    <ActionForm action={submitApplication} className="space-y-5" hidden={{ ft: token }}>
      {/* Honeypot: invisible to people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="name" label="Full name" required className="sm:col-span-2" autoComplete="name" />
        <TextField name="email" label="Email" type="email" required autoComplete="email" hint="We send your application number here." />
        <TextField name="phone" label="Phone" type="tel" required autoComplete="tel" placeholder="+8801XXXXXXXXX" />
        <TextField name="dob" label="Date of birth" type="date" required autoComplete="bday" />
        <SelectField name="courseId" label="Course" required placeholder="Select a course" defaultValue={selected} options={courses} />
        <TextArea name="address" label="Address" required className="sm:col-span-2" />
        <TextArea name="message" label="Anything you want us to know (optional)" className="sm:col-span-2" rows={2} />
      </div>
      <SubmitButton pending="Submitting…">Submit application</SubmitButton>
    </ActionForm>
  );
}
