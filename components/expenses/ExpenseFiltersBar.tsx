"use client";

import { clsx } from "clsx";
import { Search, X } from "lucide-react";
import { useId } from "react";
import { DATE_PRESETS, DEFAULT_FILTERS, presetRange } from "@/lib/analytics";
import { CATEGORIES, type Category, type ExpenseFilters } from "@/lib/types";

interface ExpenseFiltersBarProps {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
}

const controlClass =
  "block w-full rounded-lg border-0 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-600";

export function ExpenseFiltersBar({ filters, onChange }: ExpenseFiltersBarProps) {
  const id = useId();
  const update = (patch: Partial<ExpenseFilters>) => onChange({ ...filters, ...patch });

  const activePreset = DATE_PRESETS.find((p) => {
    const range = presetRange(p.id);
    return range.startDate === filters.startDate && range.endDate === filters.endDate;
  })?.id;

  const isFiltered =
    filters.search !== DEFAULT_FILTERS.search ||
    filters.category !== DEFAULT_FILTERS.category ||
    filters.startDate !== "" ||
    filters.endDate !== "";

  const rangeInvalid = filters.startDate && filters.endDate && filters.startDate > filters.endDate;

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor={`${id}-search`} className="sr-only">
            Search expenses
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
            <input
              id={`${id}-search`}
              type="search"
              placeholder="Search description, category, amount…"
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              className={clsx(controlClass, "pl-9 pr-3")}
            />
          </div>
        </div>

        <div>
          <label htmlFor={`${id}-category`} className="sr-only">
            Category
          </label>
          <select
            id={`${id}-category`}
            value={filters.category}
            onChange={(e) => update({ category: e.target.value as Category | "All" })}
            className={clsx(controlClass, "select-chevron pl-3 pr-9")}
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <label
            htmlFor={`${id}-start`}
            className="absolute -top-2 left-2 z-10 bg-white px-1 text-[11px] font-medium text-slate-500"
          >
            From
          </label>
          <input
            id={`${id}-start`}
            type="date"
            value={filters.startDate}
            max={filters.endDate || undefined}
            onChange={(e) => update({ startDate: e.target.value })}
            className={clsx(controlClass, "px-3", !filters.startDate && "!text-slate-500", rangeInvalid && "ring-red-300")}
          />
        </div>

        <div className="relative">
          <label
            htmlFor={`${id}-end`}
            className="absolute -top-2 left-2 z-10 bg-white px-1 text-[11px] font-medium text-slate-500"
          >
            To
          </label>
          <input
            id={`${id}-end`}
            type="date"
            value={filters.endDate}
            min={filters.startDate || undefined}
            onChange={(e) => update({ endDate: e.target.value })}
            className={clsx(controlClass, "px-3", !filters.endDate && "!text-slate-500", rangeInvalid && "ring-red-300")}
          />
        </div>
      </div>

      {rangeInvalid && <p className="text-sm text-red-600">The start date is after the end date.</p>}

      <div className="flex flex-wrap items-center gap-2">
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-pressed={activePreset === preset.id}
            onClick={() => update(presetRange(preset.id))}
            className={clsx(
              "rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
              activePreset === preset.id
                ? "bg-brand-600 text-white ring-brand-600"
                : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50",
            )}
          >
            {preset.label}
          </button>
        ))}
        {isFiltered && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-3.5 w-3.5" aria-hidden /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
