import { sumAmounts, totalsByCategory } from "../analytics";
import type { Expense } from "../types";
import type { ExportScope, ExportSelection, ExportSort } from "./types";

const COMPARATORS: Record<ExportSort, (a: Expense, b: Expense) => number> = {
  "date-desc": (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  "date-asc": (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
  "amount-desc": (a, b) => b.amount - a.amount || b.date.localeCompare(a.date),
};

export function inScope(expense: Expense, scope: ExportScope): boolean {
  if (scope.startDate && expense.date < scope.startDate) return false;
  if (scope.endDate && expense.date > scope.endDate) return false;
  return scope.categories.includes(expense.category);
}

export function selectForExport(expenses: Expense[], scope: ExportScope, sort: ExportSort): ExportSelection {
  const records = expenses.filter((e) => inScope(e, scope)).sort(COMPARATORS[sort]);
  let firstDate: string | null = null;
  let lastDate: string | null = null;
  for (const e of records) {
    if (!firstDate || e.date < firstDate) firstDate = e.date;
    if (!lastDate || e.date > lastDate) lastDate = e.date;
  }
  return { records, total: sumAmounts(records), byCategory: totalsByCategory(records), firstDate, lastDate };
}

/** Records per category within the date range only, so the category picker can show what each choice adds. */
export function countByCategoryInRange(expenses: Expense[], scope: Pick<ExportScope, "startDate" | "endDate">) {
  const counts = new Map<string, { count: number; total: number }>();
  for (const e of expenses) {
    if (scope.startDate && e.date < scope.startDate) continue;
    if (scope.endDate && e.date > scope.endDate) continue;
    const entry = counts.get(e.category) ?? { count: 0, total: 0 };
    entry.count++;
    entry.total += e.amount;
    counts.set(e.category, entry);
  }
  return counts;
}
