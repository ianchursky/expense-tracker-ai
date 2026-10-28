"use client";

import { FileSearch } from "lucide-react";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { CATEGORY_META } from "@/lib/categories";
import type { ExportSelection } from "@/lib/export";
import { formatCurrency, formatDate, parseISODate } from "@/lib/format";

/** Rendering every row of a large export would stall the dialog; the file itself always has all of them. */
export const PREVIEW_LIMIT = 100;

/** "May 1 – Oct 27, 2026" within a year, full dates across years, one date when they match. */
function formatSpan(first: string, last: string) {
  if (first === last) return formatDate(first);
  if (first.slice(0, 4) !== last.slice(0, 4)) return `${formatDate(first)} – ${formatDate(last)}`;
  const short = parseISODate(first).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${short} – ${formatDate(last)}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate text-base font-semibold text-slate-900 tabular-nums">{value}</dd>
    </div>
  );
}

export function ExportPreview({ selection, onReset }: { selection: ExportSelection; onReset: () => void }) {
  const { records, total, byCategory, firstDate, lastDate } = selection;
  const count = records.length;

  if (count === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <FileSearch className="h-5 w-5" aria-hidden />
        </span>
        <p className="mt-3 font-semibold text-slate-900">Nothing to export</p>
        <p className="mt-1 max-w-xs text-sm text-slate-500">No expenses match this date range and these categories.</p>
        <button type="button" onClick={onReset} className="mt-4 text-sm font-medium text-brand-600 hover:text-brand-700">
          Include all dates and categories
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-4 border-b border-slate-200 px-5 py-4 sm:px-6">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-[auto_auto_minmax(0,1fr)] sm:gap-8">
          <Stat label="Records" value={count.toLocaleString("en-US")} />
          <Stat label="Total" value={formatCurrency(total)} />
          <div className="col-span-2 sm:col-span-1">
            <Stat label="Date span" value={firstDate && lastDate ? formatSpan(firstDate, lastDate) : "—"} />
          </div>
        </dl>
        <div>
          <div className="flex h-2 overflow-hidden rounded-full bg-slate-100" role="img" aria-label="Share of total by category">
            {byCategory.map((c) => (
              <span key={c.category} style={{ width: `${c.percent}%`, backgroundColor: CATEGORY_META[c.category].color }} />
            ))}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {byCategory.map((c) => (
              <li key={c.category} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_META[c.category].color }} aria-hidden />
                {c.category} <span className="tabular-nums text-slate-500">{c.percent.toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto" tabIndex={0} aria-label="Preview of exported rows">
        <table className="w-full text-sm">
          <caption className="sr-only">
            First {Math.min(count, PREVIEW_LIMIT)} of {count} rows in export order
          </caption>
          <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-[inset_0_-1px_0_theme(colors.slate.200)]">
            <tr>
              <th scope="col" className="px-5 py-2.5 sm:pl-6">
                Date
              </th>
              <th scope="col" className="px-3 py-2.5">
                Description
              </th>
              <th scope="col" className="hidden px-3 py-2.5 sm:table-cell">
                Category
              </th>
              <th scope="col" className="px-5 py-2.5 text-right sm:pr-6">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.slice(0, PREVIEW_LIMIT).map((e) => (
              <tr key={e.id}>
                <td className="whitespace-nowrap px-5 py-2 text-slate-600 sm:pl-6">{formatDate(e.date)}</td>
                <td className="w-full max-w-0 truncate px-3 py-2 font-medium text-slate-900" title={e.description}>
                  {e.description}
                </td>
                <td className="hidden px-3 py-2 sm:table-cell">
                  <CategoryBadge category={e.category} />
                </td>
                <td className="whitespace-nowrap px-5 py-2 text-right font-medium text-slate-900 tabular-nums sm:pr-6">
                  {formatCurrency(e.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {count > PREVIEW_LIMIT && (
          <p className="border-t border-slate-100 px-5 py-3 text-center text-xs text-slate-500 sm:px-6">
            Showing the first {PREVIEW_LIMIT} of {count.toLocaleString("en-US")} rows. The file includes all of them.
          </p>
        )}
      </div>
    </div>
  );
}
