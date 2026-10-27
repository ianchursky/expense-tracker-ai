export const CATEGORIES = [
  "Food",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Bills",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Expense {
  id: string;
  /** Local calendar date, `YYYY-MM-DD`. Stored as a string to avoid timezone shifts. */
  date: string;
  /** Amount in dollars, rounded to 2 decimals. */
  amount: number;
  category: Category;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseInput = Pick<Expense, "date" | "amount" | "category" | "description">;

export interface ExpenseFilters {
  search: string;
  category: Category | "All";
  /** Inclusive `YYYY-MM-DD` bounds; empty string means unbounded. */
  startDate: string;
  endDate: string;
}

export type SortField = "date" | "amount" | "category" | "description";
export type SortDirection = "asc" | "desc";

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}
