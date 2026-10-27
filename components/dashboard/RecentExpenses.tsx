"use client";

import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useExpenseDialogs } from "@/components/providers/ExpenseDialogProvider";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Expense } from "@/lib/types";

export function RecentExpenses({ expenses }: { expenses: Expense[] }) {
  const { openEdit } = useExpenseDialogs();

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Recent transactions"
        action={
          <Link
            href="/expenses"
            className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View all <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      />
      <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
        {expenses.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => openEdit(e)}
              aria-label={`Edit ${e.description}, ${formatCurrency(e.amount)}`}
              className="group flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:-outline-offset-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{e.description}</p>
                <p className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                  <CategoryBadge category={e.category} />
                  <span className="whitespace-nowrap">{formatDate(e.date)}</span>
                </p>
              </div>
              <span className="w-24 shrink-0 text-right text-sm font-semibold text-slate-900 tabular-nums">
                {formatCurrency(e.amount)}
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-slate-700"
                aria-hidden
              />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
