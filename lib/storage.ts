import { isValidISODate } from "./format";
import { isCategory, type Expense } from "./types";

export const STORAGE_KEY = "expense-tracker:expenses:v1";

function isExpense(value: unknown): value is Expense {
  if (!value || typeof value !== "object") return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.date === "string" &&
    isValidISODate(e.date) &&
    typeof e.amount === "number" &&
    Number.isFinite(e.amount) &&
    isCategory(e.category) &&
    typeof e.description === "string" &&
    typeof e.createdAt === "string" &&
    typeof e.updatedAt === "string"
  );
}

export interface LoadResult {
  expenses: Expense[];
  /** Number of stored records that were dropped because they were malformed. */
  skipped: number;
  error?: string;
}

/** Parses the raw localStorage value. Exposed separately so the cross-tab `storage` event can reuse it. */
export function parseStoredExpenses(raw: string | null): LoadResult {
  if (!raw) return { expenses: [], skipped: 0 };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { expenses: [], skipped: 0, error: "Saved data was in an unexpected format and was ignored." };
    }
    const expenses = parsed.filter(isExpense);
    return { expenses, skipped: parsed.length - expenses.length };
  } catch {
    return { expenses: [], skipped: 0, error: "Saved data is corrupted and could not be read." };
  }
}

export function loadExpenses(): LoadResult {
  try {
    return parseStoredExpenses(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return { expenses: [], skipped: 0, error: "Browser storage is unavailable. Changes won't be saved." };
  }
}

/** Returns an error message on failure (e.g. quota exceeded, private mode), otherwise null. */
export function saveExpenses(expenses: Expense[]): string | null {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    return null;
  } catch {
    return "Couldn't save to browser storage. Your latest changes may be lost on reload.";
  }
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
