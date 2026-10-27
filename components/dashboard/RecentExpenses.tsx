"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useExpenseDialogs } from "@/components/providers/ExpenseDialogProvider";
import { CategoryIcon } from "@/components/ui/CategoryBadge";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Expense } from "@/lib/types";

export function RecentExpenses({ expenses }: { expenses: Expense[] }) {
  const { openEdit } = useExpenseDialogs();

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Recent expenses"
        action={
          <Link
            href="/expenses"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View all <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      />
      <ul className="mt-3 divide-y divide-slate-100">
        {expenses.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => openEdit(e)}
              className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-slate-50"
            >
              <CategoryIcon category={e.category} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{e.description}</p>
                <p className="text-xs text-slate-500">
                  {e.category} · {formatDate(e.date)}
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">{formatCurrency(e.amount)}</span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
