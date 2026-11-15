"use client";

import clsx from "clsx";
import { createContext, useActionState, useContext, useId, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/validation";

const FormContext = createContext<ActionState>({});

/** Wraps a server action; exposes validation errors and re-filled values to the <Field> components inside. */
export function ActionForm({
  action,
  children,
  className,
  hidden,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  hidden?: Record<string, string>;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <FormContext.Provider value={state}>
      <form action={formAction} className={className} noValidate>
        {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        {state.message && !state.ok && state.message !== "Please fix the highlighted fields." && (
          <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {state.message}
          </div>
        )}
        {state.ok && state.message && (
          <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {state.message}
          </div>
        )}
        {children}
      </form>
    </FormContext.Provider>
  );
}

export function SubmitButton({ children, pending: pendingText = "Saving…", className }: { children: ReactNode; pending?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={clsx(
        "inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {pending ? pendingText : children}
    </button>
  );
}

const inputClass =
  "block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50";

type FieldProps = {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string;
  className?: string;
};

function useField(name: string, defaultValue?: string) {
  const state = useContext(FormContext);
  const id = useId();
  const error = state.fieldErrors?.[name]?.[0];
  const value = state.values?.[name] ?? defaultValue ?? "";
  return { id, error, value };
}

function FieldShell({ id, label, hint, error, className, required, children }: { id: string; label: string; hint?: string; error?: string; className?: string; required?: boolean; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800">
        {label}
        {required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : (
        hint && <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

export function TextField({ name, label, hint, defaultValue, className, required, ...rest }: FieldProps & { required?: boolean } & Omit<ComponentProps<"input">, "name" | "defaultValue" | "className">) {
  const { id, error, value } = useField(name, defaultValue);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className} required={required}>
      <input
        id={id}
        name={name}
        defaultValue={value}
        key={value}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={clsx(inputClass, error ? "border-red-400" : "border-slate-300")}
        {...rest}
      />
    </FieldShell>
  );
}

export function TextArea({ name, label, hint, defaultValue, className, required, rows = 3 }: FieldProps & { required?: boolean; rows?: number }) {
  const { id, error, value } = useField(name, defaultValue);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className} required={required}>
      <textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={value}
        key={value}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={clsx(inputClass, error ? "border-red-400" : "border-slate-300")}
      />
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  hint,
  defaultValue,
  className,
  required,
  options,
  placeholder,
}: FieldProps & { required?: boolean; options: { value: string; label: string }[]; placeholder?: string }) {
  const { id, error, value } = useField(name, defaultValue);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className} required={required}>
      <select
        id={id}
        name={name}
        defaultValue={value}
        key={value}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={clsx(inputClass, error ? "border-red-400" : "border-slate-300")}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
