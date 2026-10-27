import { monthKey, roundToCents, toISODate } from "./format";
import { CATEGORIES, type Category, type Expense, type ExpenseFilters, type SortState } from "./types";

export const DEFAULT_FILTERS: ExpenseFilters = {
  search: "",
  category: "All",
  startDate: "",
  endDate: "",
};

export function filterExpenses(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  const query = filters.search.trim().toLowerCase();
  return expenses.filter((e) => {
    if (filters.category !== "All" && e.category !== filters.category) return false;
    // ISO date strings compare correctly as strings.
    if (filters.startDate && e.date < filters.startDate) return false;
    if (filters.endDate && e.date > filters.endDate) return false;
    if (query) {
      const haystack = `${e.description} ${e.category} ${e.amount.toFixed(2)}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function sortExpenses(expenses: Expense[], sort: SortState): Expense[] {
  const dir = sort.direction === "asc" ? 1 : -1;
  return [...expenses].sort((a, b) => {
    let cmp: number;
    switch (sort.field) {
      case "amount":
        cmp = a.amount - b.amount;
        break;
      case "category":
        cmp = a.category.localeCompare(b.category);
        break;
      case "description":
        cmp = a.description.localeCompare(b.description);
        break;
      default:
        cmp = a.date.localeCompare(b.date);
    }
    // Tie-break by creation time so the order is stable and newest entries come first.
    if (cmp === 0) cmp = a.createdAt.localeCompare(b.createdAt);
    return cmp * dir;
  });
}

export function sumAmounts(expenses: Expense[]): number {
  return roundToCents(expenses.reduce((sum, e) => sum + e.amount, 0));
}

export interface CategoryTotal {
  category: Category;
  total: number;
  count: number;
  /** Share of the overall total, 0–100. */
  percent: number;
}

export function totalsByCategory(expenses: Expense[]): CategoryTotal[] {
  const overall = sumAmounts(expenses);
  return CATEGORIES.map((category) => {
    const items = expenses.filter((e) => e.category === category);
    const total = sumAmounts(items);
    return {
      category,
      total,
      count: items.length,
      percent: overall > 0 ? (total / overall) * 100 : 0,
    };
  })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.total - a.total);
}

export interface MonthTotal {
  /** `YYYY-MM` */
  month: string;
  total: number;
}

/** Totals for the last `months` calendar months ending with the month of `now`, oldest first. */
export function monthlyTotals(expenses: Expense[], months: number, now = new Date()): MonthTotal[] {
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    keys.push(monthKey(toISODate(new Date(now.getFullYear(), now.getMonth() - i, 1))));
  }
  const totals = new Map<string, number>(keys.map((k): [string, number] => [k, 0]));
  for (const e of expenses) {
    const key = monthKey(e.date);
    if (totals.has(key)) totals.set(key, totals.get(key)! + e.amount);
  }
  return keys.map((month) => ({ month, total: roundToCents(totals.get(month)!) }));
}

export interface DashboardSummary {
  total: number;
  count: number;
  thisMonth: number;
  lastMonth: number;
  /** Percent change of this month vs. last month; null when last month had no spending. */
  monthChange: number | null;
  /** Average spending per day so far this month. */
  dailyAverageThisMonth: number;
  topCategory: CategoryTotal | null;
  thisMonthCount: number;
}

export function getDashboardSummary(expenses: Expense[], now = new Date()): DashboardSummary {
  const thisMonthKey = monthKey(toISODate(now));
  const lastMonthKey = monthKey(toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1)));

  const thisMonthItems = expenses.filter((e) => monthKey(e.date) === thisMonthKey);
  const thisMonth = sumAmounts(thisMonthItems);
  const lastMonth = sumAmounts(expenses.filter((e) => monthKey(e.date) === lastMonthKey));

  return {
    total: sumAmounts(expenses),
    count: expenses.length,
    thisMonth,
    lastMonth,
    monthChange: lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null,
    dailyAverageThisMonth: roundToCents(thisMonth / now.getDate()),
    topCategory: totalsByCategory(thisMonthItems)[0] ?? totalsByCategory(expenses)[0] ?? null,
    thisMonthCount: thisMonthItems.length,
  };
}

export type DatePreset = "this-month" | "last-month" | "last-30" | "this-year" | "all";

export const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "this-month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "last-30", label: "Last 30 days" },
  { id: "this-year", label: "This year" },
];

export function presetRange(preset: DatePreset, now = new Date()): { startDate: string; endDate: string } {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case "this-month":
      return { startDate: toISODate(new Date(y, m, 1)), endDate: toISODate(new Date(y, m + 1, 0)) };
    case "last-month":
      return { startDate: toISODate(new Date(y, m - 1, 1)), endDate: toISODate(new Date(y, m, 0)) };
    case "last-30":
      return { startDate: toISODate(new Date(y, m, now.getDate() - 29)), endDate: toISODate(now) };
    case "this-year":
      return { startDate: toISODate(new Date(y, 0, 1)), endDate: toISODate(new Date(y, 11, 31)) };
    default:
      return { startDate: "", endDate: "" };
  }
}
