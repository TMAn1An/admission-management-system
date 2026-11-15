const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

/** Dates are stored as calendar dates (UTC midnight); format them in UTC to avoid off-by-one shifts. */
export function formatDate(date: Date | string): string {
  return dateFmt.format(new Date(date));
}

export function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export const admissionNo = (n: number) => `ADM-${String(n).padStart(6, "0")}`;
export const receiptNo = (n: number) => `RCT-${String(n).padStart(6, "0")}`;

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
