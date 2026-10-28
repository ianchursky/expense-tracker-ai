"use client";

import { clsx } from "clsx";
import { Braces, FileSpreadsheet, FileText, RotateCcw, type LucideIcon } from "lucide-react";
import { useId, useMemo, type ReactNode } from "react";
import { presetRange } from "@/lib/analytics";
import { CATEGORY_META } from "@/lib/categories";
import {
  EXPORT_FORMATS,
  FORMAT_ORDER,
  MAX_FILENAME_LENGTH,
  countByCategoryInRange,
  validateFilename,
  withExtension,
  type CsvDelimiter,
  type ExportFormatId,
  type ExportSort,
} from "@/lib/export";
import { formatCurrency, toISODate } from "@/lib/format";
import { CATEGORIES, type Expense } from "@/lib/types";
import type { ExportDraft } from "./useExportDraft";

const FORMAT_ICONS: Record<ExportFormatId, LucideIcon> = { csv: FileSpreadsheet, json: Braces, pdf: FileText };

type RangePreset = "all" | "this-month" | "last-month" | "last-90" | "this-year" | "last-year";
const RANGE_PRESETS: { id: RangePreset; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "this-month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "last-90", label: "Last 90 days" },
  { id: "this-year", label: "This year" },
  { id: "last-year", label: "Last year" },
];

function rangeFor(preset: RangePreset, now = new Date()) {
  const y = now.getFullYear();
  switch (preset) {
    case "last-90":
      return { startDate: toISODate(new Date(y, now.getMonth(), now.getDate() - 89)), endDate: toISODate(now) };
    case "last-year":
      return { startDate: `${y - 1}-01-01`, endDate: `${y - 1}-12-31` };
    default:
      return presetRange(preset);
  }
}

const SORT_OPTIONS: { id: ExportSort; label: string }[] = [
  { id: "date-desc", label: "Newest first" },
  { id: "date-asc", label: "Oldest first" },
  { id: "amount-desc", label: "Largest amount first" },
];

const DELIMITERS: { id: CsvDelimiter; label: string; hint: string }[] = [
  { id: ",", label: "Comma", hint: "Most spreadsheet apps" },
  { id: ";", label: "Semicolon", hint: "Excel in regions that use a decimal comma" },
  { id: "\t", label: "Tab", hint: "Paste straight into a spreadsheet" },
];

const inputClass =
  "block w-full rounded-lg border-0 py-2 text-base text-slate-900 shadow-sm ring-1 ring-inset placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-inset sm:text-sm disabled:bg-slate-50 disabled:text-slate-500";

function Section({ title, aside, error, children }: { title: string; aside?: ReactNode; error?: string | null; children: ReactNode }) {
  const errorId = useId();
  return (
    <fieldset
      className="relative border-b border-slate-100 px-5 py-5 last:border-b-0 sm:px-6"
      aria-describedby={error ? errorId : undefined}
    >
      {/* A legend only names its fieldset as the first child, so the side action is positioned separately. */}
      <legend className="float-left mb-3 w-full pr-40 text-sm font-semibold text-slate-900">{title}</legend>
      {aside && <div className="absolute right-5 top-5 sm:right-6">{aside}</div>}
      <div className="clear-both">{children}</div>
      {error && (
        <p id={errorId} className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function Choice({
  name,
  checked,
  onChange,
  children,
  className,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={clsx(
        "relative flex cursor-pointer rounded-lg border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60",
        checked ? "border-brand-600 bg-brand-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
        className,
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      {children}
    </label>
  );
}

interface ExportOptionsPanelProps {
  draft: ExportDraft;
  expenses: Expense[];
  disabled: boolean;
}

export function ExportOptionsPanel({ draft, expenses, disabled }: ExportOptionsPanelProps) {
  const id = useId();
  const { options } = draft;
  const { scope } = options;
  const format = EXPORT_FORMATS[options.format];

  const counts = useMemo(() => countByCategoryInRange(expenses, scope), [expenses, scope]);
  const activePreset = RANGE_PRESETS.find((p) => {
    const r = rangeFor(p.id);
    return r.startDate === scope.startDate && r.endDate === scope.endDate;
  })?.id;
  const rangeError = scope.startDate && scope.endDate && scope.startDate > scope.endDate ? "The start date is after the end date." : null;
  const categoryError = scope.categories.length === 0 ? "Choose at least one category." : null;
  const filenameError = validateFilename(options.filename);

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <Section title="Format">
        <div className="grid gap-2">
          {FORMAT_ORDER.map((fid) => {
            const f = EXPORT_FORMATS[fid];
            const Icon = FORMAT_ICONS[fid];
            const checked = options.format === fid;
            return (
              <Choice key={fid} name={`${id}-format`} checked={checked} onChange={() => draft.setFormat(fid)} className="items-start gap-3">
                <span
                  className={clsx(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                    checked ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="font-semibold text-slate-900">{f.label}</span>
                    <span className="font-mono text-xs text-slate-500">.{f.extension}</span>
                  </span>
                  <span className="block text-xs leading-snug text-slate-600">{f.description}</span>
                </span>
              </Choice>
            );
          })}
        </div>
      </Section>

      <Section title="Date range" error={rangeError}>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Date range presets">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={activePreset === p.id}
              onClick={() => {
                const r = rangeFor(p.id);
                draft.setRange(r.startDate, r.endDate);
              }}
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
                activePreset === p.id ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(["startDate", "endDate"] as const).map((key) => (
            <div key={key}>
              <label htmlFor={`${id}-${key}`} className="block text-xs font-medium text-slate-600">
                {key === "startDate" ? "From" : "To"}
              </label>
              <input
                id={`${id}-${key}`}
                type="date"
                value={scope[key]}
                onChange={(e) =>
                  key === "startDate" ? draft.setRange(e.target.value, scope.endDate) : draft.setRange(scope.startDate, e.target.value)
                }
                aria-invalid={!!rangeError}
                className={clsx(inputClass, "mt-1 px-3", rangeError ? "ring-red-300 focus:ring-red-500" : "ring-slate-300 focus:ring-brand-600")}
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">Leave a date empty to include everything before or after.</p>
      </Section>

      <Section
        title="Categories"
        error={categoryError}
        aside={
          <span className="flex gap-3 text-xs font-medium">
            <button type="button" onClick={() => draft.setCategories([...CATEGORIES])} className="text-brand-600 hover:text-brand-700">
              Select all
            </button>
            <button type="button" onClick={() => draft.setCategories([])} className="text-slate-600 hover:text-slate-900">
              Clear
            </button>
          </span>
        }
      >
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {CATEGORIES.map((category) => {
            const c = counts.get(category);
            const checked = scope.categories.includes(category);
            return (
              <li key={category}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => draft.toggleCategory(category)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 accent-brand-600"
                  />
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_META[category].color }} aria-hidden />
                  <span className={clsx("flex-1 font-medium", checked ? "text-slate-900" : "text-slate-500")}>{category}</span>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {c ? `${c.count} · ${formatCurrency(c.total)}` : "none in range"}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title={`${format.label} settings`}>
        <div className="space-y-4">
          <div>
            <label htmlFor={`${id}-sort`} className="block text-xs font-medium text-slate-600">
              Row order
            </label>
            <select
              id={`${id}-sort`}
              value={options.sort}
              onChange={(e) => draft.setSort(e.target.value as ExportSort)}
              className={clsx(inputClass, "mt-1 pl-3 pr-8 ring-slate-300 focus:ring-brand-600")}
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {options.format === "csv" && (
            <div role="radiogroup" aria-label="Column separator">
              <p className="text-xs font-medium text-slate-600">Column separator</p>
              <div className="mt-1 grid gap-2 sm:grid-cols-3">
                {DELIMITERS.map((d) => (
                  <Choice
                    key={d.label}
                    name={`${id}-delimiter`}
                    checked={options.settings.csv.delimiter === d.id}
                    onChange={() => draft.updateSettings({ csv: { delimiter: d.id } })}
                    className="flex-col"
                  >
                    <span className="font-medium text-slate-900">{d.label}</span>
                    <span className="text-xs text-slate-500">{d.hint}</span>
                  </Choice>
                ))}
              </div>
            </div>
          )}

          {options.format === "json" && (
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={options.settings.json.pretty}
                onChange={(e) => draft.updateSettings({ json: { pretty: e.target.checked } })}
                className="mt-0.5 h-4 w-4 rounded accent-brand-600"
              />
              <span>
                <span className="font-medium text-slate-900">Pretty-print</span>
                <span className="block text-xs text-slate-500">Indented and readable. Turn off for the smallest file.</span>
              </span>
            </label>
          )}

          {options.format === "pdf" && (
            <>
              <div role="radiogroup" aria-label="Page orientation">
                <p className="text-xs font-medium text-slate-600">Page orientation</p>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {(["portrait", "landscape"] as const).map((o) => (
                    <Choice
                      key={o}
                      name={`${id}-orientation`}
                      checked={options.settings.pdf.orientation === o}
                      onChange={() => draft.updateSettings({ pdf: { orientation: o } })}
                      className="items-center gap-2"
                    >
                      <span
                        className={clsx("rounded-sm border-2 border-current text-slate-400", o === "portrait" ? "h-4 w-3" : "h-3 w-4")}
                        aria-hidden
                      />
                      <span className="font-medium capitalize text-slate-900">{o}</span>
                    </Choice>
                  ))}
                </div>
              </div>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={options.settings.pdf.includeBreakdown}
                  onChange={(e) => draft.updateSettings({ pdf: { includeBreakdown: e.target.checked } })}
                  className="mt-0.5 h-4 w-4 rounded accent-brand-600"
                />
                <span>
                  <span className="font-medium text-slate-900">Include category breakdown</span>
                  <span className="block text-xs text-slate-500">A summary table of totals and shares before the transactions.</span>
                </span>
              </label>
            </>
          )}
        </div>
      </Section>

      <Section
        title="File name"
        error={filenameError}
        aside={
          draft.filenameEdited && (
            <button type="button" onClick={draft.resetFilename} className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900">
              <RotateCcw className="h-3 w-3" aria-hidden /> Use suggested name
            </button>
          )
        }
      >
        <label htmlFor={`${id}-filename`} className="sr-only">
          File name
        </label>
        <div className="flex rounded-lg shadow-sm">
          <input
            id={`${id}-filename`}
            type="text"
            value={options.filename}
            maxLength={MAX_FILENAME_LENGTH + 10}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => draft.setFilename(e.target.value)}
            aria-invalid={!!filenameError}
            className={clsx(
              inputClass,
              "rounded-r-none px-3 font-mono shadow-none",
              filenameError ? "ring-red-300 focus:ring-red-500" : "ring-slate-300 focus:ring-brand-600",
            )}
          />
          <span className="inline-flex items-center rounded-r-lg border border-l-0 border-slate-300 bg-slate-50 px-3 font-mono text-sm text-slate-500">
            .{format.extension}
          </span>
        </div>
        {!filenameError && (
          <p className="mt-2 text-xs text-slate-500">
            Downloads as <span className="font-mono text-slate-700">{withExtension(options.filename, format.extension)}</span>
          </p>
        )}
      </Section>
    </fieldset>
  );
}
