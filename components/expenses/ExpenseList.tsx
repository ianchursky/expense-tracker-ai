"use client";

import { clsx } from "clsx";
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { useExpenseDialogs } from "@/components/providers/ExpenseDialogProvider";
import { CategoryBadge, CategoryIcon } from "@/components/ui/CategoryBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Expense, SortField, SortState } from "@/lib/types";

interface ExpenseListProps {
  expenses: Expense[];
  sort: SortState;
  onSortChange: (sort: SortState) => void;
}

function SortHeader({
  field,
  label,
  sort,
  onSortChange,
  align = "left",
}: {
  field: SortField;
  label: string;
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  align?: "left" | "right";
}) {
  const active = sort.field === field;
  const Icon = !active ? ArrowUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
      className={clsx("px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500", align === "right" && "text-right")}
    >
      <button
        type="button"
        onClick={() =>
          onSortChange({
            field,
            // New column: dates and amounts default to descending, text columns to ascending.
            direction: active
              ? sort.direction === "asc"
                ? "desc"
                : "asc"
              : field === "date" || field === "amount"
                ? "desc"
                : "asc",
          })
        }
        className={clsx("inline-flex items-center gap-1 hover:text-slate-900", active && "text-slate-900")}
      >
        {label}
        <Icon className={clsx("h-3.5 w-3.5", !active && "opacity-40")} aria-hidden />
      </button>
    </th>
  );
}

function RowActions({ expense }: { expense: Expense }) {
  const { openEdit, requestDelete } = useExpenseDialogs();
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => openEdit(expense)}
        className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        aria-label={`Edit ${expense.description}`}
        title="Edit"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => requestDelete(expense)}
        className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
        aria-label={`Delete ${expense.description}`}
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ExpenseList({ expenses, sort, onSortChange }: ExpenseListProps) {
  return (
    <>
      {/* Desktop: table */}
      <table className="hidden w-full md:table">
        <thead className="border-y border-slate-200 bg-slate-50/60 text-left">
          <tr>
            <SortHeader field="date" label="Date" sort={sort} onSortChange={onSortChange} />
            <SortHeader field="description" label="Description" sort={sort} onSortChange={onSortChange} />
            <SortHeader field="category" label="Category" sort={sort} onSortChange={onSortChange} />
            <SortHeader field="amount" label="Amount" sort={sort} onSortChange={onSortChange} align="right" />
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {expenses.map((e) => (
            <tr key={e.id} className="group transition-colors hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{formatDate(e.date)}</td>
              <td className="max-w-xs truncate px-4 py-3 text-sm font-medium text-slate-900" title={e.description}>
                {e.description}
              </td>
              <td className="px-4 py-3">
                <CategoryBadge category={e.category} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-slate-900 tabular-nums">
                {formatCurrency(e.amount)}
              </td>
              <td className="w-24 px-2 py-1.5">
                <div className="opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                  <RowActions expense={e} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: stacked cards */}
      <ul className="divide-y divide-slate-100 border-t border-slate-200 md:hidden">
        {expenses.map((e) => (
          <li key={e.id} className="flex items-center gap-3 px-4 py-3">
            <CategoryIcon category={e.category} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium text-slate-900">{e.description}</p>
                <p className="shrink-0 text-sm font-semibold text-slate-900 tabular-nums">{formatCurrency(e.amount)}</p>
              </div>
              <p className="text-xs text-slate-500">
                {e.category} · {formatDate(e.date)}
              </p>
            </div>
            <RowActions expense={e} />
          </li>
        ))}
      </ul>
    </>
  );
}
