import type { ExportScope } from "./types";

export const MAX_FILENAME_LENGTH = 80;

// Characters no common filesystem accepts, plus control characters.
const ILLEGAL = /[<>:"/\\|?*\u0000-\u001f]/g;
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

/** Makes user input safe to use as a download name, keeping what they typed wherever possible. */
export function sanitizeFilename(input: string): string {
  let name = input.replace(ILLEGAL, "").replace(/\s+/g, " ").trim();
  name = name.replace(/^\.+|\.+$/g, ""); // no leading dot (hidden files) or trailing dot (Windows)
  if (WINDOWS_RESERVED.test(name)) name = `${name}_`;
  return name.slice(0, MAX_FILENAME_LENGTH).trim();
}

/** Returns an error message, or null when the filename is usable. */
export function validateFilename(input: string): string | null {
  if (!input.trim()) return "Enter a file name.";
  if (input.length > MAX_FILENAME_LENGTH) return `Keep it under ${MAX_FILENAME_LENGTH} characters.`;
  if (!sanitizeFilename(input)) return "Use letters or numbers in the file name.";
  return null;
}

/** e.g. `expenses_2026-10-01_to_2026-10-31`, `expenses_since_2026-01-01`, `expenses_all-time`. */
export function defaultFilename(scope: Pick<ExportScope, "startDate" | "endDate">): string {
  const { startDate, endDate } = scope;
  if (startDate && endDate) return `expenses_${startDate}_to_${endDate}`;
  if (startDate) return `expenses_since_${startDate}`;
  if (endDate) return `expenses_through_${endDate}`;
  return "expenses_all-time";
}

/** Appends the format's extension unless the user already typed it. */
export function withExtension(base: string, extension: string): string {
  const clean = sanitizeFilename(base) || "expenses";
  return clean.toLowerCase().endsWith(`.${extension}`) ? clean : `${clean}.${extension}`;
}
