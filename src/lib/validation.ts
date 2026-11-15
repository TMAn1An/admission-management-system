import { z } from "zod";

const text = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date");

export const studentSchema = z.object({
  name: text("Full name", 100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{6,17}$/, "Enter a valid phone number (7–18 digits)"),
  address: text("Address", 300),
  dob: dateString.refine((v) => {
    const d = new Date(v);
    const now = new Date();
    return d < now && now.getUTCFullYear() - d.getUTCFullYear() >= 10;
  }, "Date of birth looks incorrect"),
});

export const courseSchema = z.object({
  name: text("Course name", 150),
  duration: text("Duration", 50),
  fee: z.coerce.number({ message: "Enter a valid fee" }).positive("Fee must be greater than 0").max(99999999),
  capacity: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .pipe(z.number().int().positive("Capacity must be a positive whole number").nullable()),
  departmentId: z.string().trim().transform((v) => (v === "" ? null : v)),
});

export const departmentSchema = z.object({
  name: text("Department name", 100),
  head: z.string().trim().max(100).transform((v) => (v === "" ? null : v)),
});

export const admissionSchema = z.object({
  studentId: z.string().min(1, "Select a student"),
  courseId: z.string().min(1, "Select a course"),
  admissionDate: dateString,
});

export const paymentSchema = z.object({
  admissionId: z.string().min(1),
  amount: z.coerce.number({ message: "Enter a valid amount" }).positive("Amount must be greater than 0"),
  paidOn: dateString,
  method: z.enum(["CASH", "CARD", "ONLINE", "CHEQUE"], { message: "Select a payment method" }),
});

export const userSchema = z.object({
  name: text("Name", 100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(120),
  password: z.string().min(10, "Use at least 10 characters").max(100),
  role: z.enum(["ADMIN", "STAFF"]),
});

const newPassword = z.string().min(10, "Use at least 10 characters").max(100, "Password is too long");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword,
    confirmPassword: z.string().min(1, "Repeat the new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ["newPassword"], message: "Choose a password different from the current one" });

export const resetPasswordSchema = z.object({ newPassword });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export type ActionState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

export function parseForm<S extends z.ZodType>(schema: S, formData: FormData) {
  const raw = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );
  const result = schema.safeParse(raw);
  if (result.success) return { data: result.data as z.output<S> };
  const { fieldErrors } = z.flattenError(result.error);
  const values = Object.fromEntries(Object.entries(raw).filter(([k]) => !/password/i.test(k)));
  return {
    error: {
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors as Record<string, string[] | undefined>,
      values,
    } satisfies ActionState,
  };
}

export const toDate = (v: string) => new Date(`${v}T00:00:00.000Z`);
