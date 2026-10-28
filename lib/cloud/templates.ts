import { FileSpreadsheet, Landmark, PieChart, ArchiveRestore, type LucideIcon } from "lucide-react";
import { sumAmounts, totalsByCategory } from "../analytics";
import { formatCurrency, formatDate, formatMonthKey, monthKey, roundToCents, toISODate } from "../format";
import { CATEGORIES, type Expense } from "../types";
import type { FileFormat, Period, TemplateId, TemplateOutput } from "./types";

export interface ExportTemplate {
  id: TemplateId;
  name: string;
  /** Who it's for, in one line. */
  purpose: string;
  icon: LucideIcon;
  /** Tailwind classes for the icon tile; literal so Tailwind's scanner keeps them. */
  tint: string;
  defaultFormat: FileFormat;
  periodKinds: Period["kind"][];
  build(expenses: Expense[], period: Period): TemplateOutput;
}

export function inPeriod(e: Expense, period: Period): boolean {
  if (period.kind === "year") return e.date.startsWith(`${period.value}-`);
  if (period.kind === "month") return monthKey(e.date) === period.value;
  return true;
}

export function describePeriod(period: Period): string {
  if (period.kind === "year") return `Tax year ${period.value}`;
  if (period.kind === "month") return formatMonthKey(period.value, "long");
  return "All time";
}

function previousMonth(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return monthKey(toISODate(new Date(y, m - 2, 1)));
}

const pct = (n: number) => `${n.toFixed(1)}%`;

export const TEMPLATES: ExportTemplate[] = [
  {
    id: "tax-report",
    name: "Tax Report",
    purpose: "Category totals for a tax year, ready for an accountant",
    icon: Landmark,
    tint: "bg-emerald-50 text-emerald-700",
    defaultFormat: "csv",
    periodKinds: ["year"],
    build(expenses, period) {
      const items = expenses.filter((e) => inPeriod(e, period));
      const total = sumAmounts(items);
      return {
        title: "Tax Report",
        subtitle: describePeriod(period),
        columns: ["Category", "Transactions", "Total (USD)", "Share of year"],
        rows: totalsByCategory(items).map((c) => [c.category, c.count, roundToCents(c.total), pct(c.percent)]),
        highlights: [
          { label: "Total spending", value: formatCurrency(total) },
          { label: "Transactions", value: items.length.toLocaleString("en-US") },
          { label: "Categories", value: String(new Set(items.map((e) => e.category)).size) },
        ],
        sourceCount: items.length,
      };
    },
  },
  {
    id: "monthly-summary",
    name: "Monthly Summary",
    purpose: "How one month compares with the month before",
    icon: FileSpreadsheet,
    tint: "bg-sky-50 text-sky-700",
    defaultFormat: "csv",
    periodKinds: ["month"],
    build(expenses, period) {
      const key = period.kind === "month" ? period.value : monthKey(toISODate(new Date()));
      const prevKey = previousMonth(key);
      const items = expenses.filter((e) => monthKey(e.date) === key);
      const prev = expenses.filter((e) => monthKey(e.date) === prevKey);
      const total = sumAmounts(items);
      const prevTotal = sumAmounts(prev);
      const rows = CATEGORIES.map((category) => {
        const now = sumAmounts(items.filter((e) => e.category === category));
        const before = sumAmounts(prev.filter((e) => e.category === category));
        const change = before > 0 ? `${now >= before ? "+" : ""}${(((now - before) / before) * 100).toFixed(0)}%` : now > 0 ? "new" : "—";
        return [category, items.filter((e) => e.category === category).length, now, before, change] as [string, number, number, number, string];
      }).filter((r) => r[1] > 0 || r[3] > 0);
      const [y, m] = key.split("-").map(Number);
      // A month still in progress averages over the days so far, not the whole month.
      const today = new Date();
      const isCurrent = today.getFullYear() === y && today.getMonth() === m - 1;
      const daysInMonth = isCurrent ? today.getDate() : new Date(y, m, 0).getDate();
      return {
        title: "Monthly Summary",
        subtitle: formatMonthKey(key, "long"),
        columns: ["Category", "Transactions", "This month (USD)", `${formatMonthKey(prevKey)} (USD)`, "Change"],
        rows,
        highlights: [
          { label: "Spent", value: formatCurrency(total) },
          {
            label: "vs previous month",
            value: prevTotal > 0 ? `${total >= prevTotal ? "+" : ""}${(((total - prevTotal) / prevTotal) * 100).toFixed(1)}%` : "—",
          },
          { label: "Daily average", value: formatCurrency(total / daysInMonth) },
        ],
        sourceCount: items.length,
      };
    },
  },
  {
    id: "category-analysis",
    name: "Category Analysis",
    purpose: "Averages, extremes and monthly run-rate per category",
    icon: PieChart,
    tint: "bg-purple-50 text-purple-700",
    defaultFormat: "csv",
    periodKinds: ["all", "year"],
    build(expenses, period) {
      const items = expenses.filter((e) => inPeriod(e, period));
      const months = Math.max(1, new Set(items.map((e) => monthKey(e.date))).size);
      const rows = totalsByCategory(items).map((c) => {
        const own = items.filter((e) => e.category === c.category);
        const largest = own.reduce((a, b) => (b.amount > a.amount ? b : a));
        return [c.category, c.count, roundToCents(c.total), roundToCents(c.total / c.count), roundToCents(c.total / months), `${largest.description} (${formatCurrency(largest.amount)})`, pct(c.percent)];
      });
      return {
        title: "Category Analysis",
        subtitle: describePeriod(period),
        columns: ["Category", "Transactions", "Total (USD)", "Average (USD)", "Per month (USD)", "Largest", "Share"],
        rows,
        highlights: [
          { label: "Total", value: formatCurrency(sumAmounts(items)) },
          { label: "Months covered", value: String(months) },
          { label: "Biggest category", value: String(rows[0]?.[0] ?? "—") },
        ],
        sourceCount: items.length,
      };
    },
  },
  {
    id: "full-backup",
    name: "Full Backup",
    purpose: "Every expense, for safekeeping or moving to another app",
    icon: ArchiveRestore,
    tint: "bg-amber-50 text-amber-700",
    defaultFormat: "json",
    periodKinds: ["all"],
    build(expenses) {
      const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
      return {
        title: "Full Backup",
        subtitle: sorted.length ? `${formatDate(sorted[sorted.length - 1].date)} – ${formatDate(sorted[0].date)}` : "No expenses yet",
        columns: ["Date", "Category", "Description", "Amount (USD)"],
        rows: sorted.map((e) => [e.date, e.category, e.description, e.amount]),
        highlights: [
          { label: "Expenses", value: sorted.length.toLocaleString("en-US") },
          { label: "Total", value: formatCurrency(sumAmounts(sorted)) },
        ],
        sourceCount: sorted.length,
      };
    },
  },
];

export const getTemplate = (id: TemplateId) => TEMPLATES.find((t) => t.id === id)!;

/** Sensible starting period for a template: the latest complete year, the current month, or all time. */
export function defaultPeriod(template: ExportTemplate, now = new Date()): Period {
  const kind = template.periodKinds[0];
  if (kind === "year") return { kind, value: String(now.getFullYear()) };
  if (kind === "month") return { kind, value: monthKey(toISODate(now)) };
  return { kind: "all" };
}
