"use client";

import { Download, Plus, Receipt, SearchX, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useExpenseDialogs } from "@/components/providers/ExpenseDialogProvider";
import { useExpenses } from "@/components/providers/ExpenseProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Card, Skeleton } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { DEFAULT_FILTERS, filterExpenses, sortExpenses, sumAmounts } from "@/lib/analytics";
import { downloadCSV, expensesToCSV } from "@/lib/csv";
import { formatCurrency, todayISO } from "@/lib/format";
import { generateSampleExpenses } from "@/lib/sampleData";
import type { ExpenseFilters, SortState } from "@/lib/types";
import { ExpenseFiltersBar } from "./ExpenseFiltersBar";
import { ExpenseList } from "./ExpenseList";

const PAGE_SIZE = 50;

function ListSkeleton() {
  return (
    <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading expenses">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-10" />
      ))}
    </div>
  );
}

export function ExpensesView() {
  const { expenses, isLoaded, addExpenses, clearAll } = useExpenses();
  const { openAdd, confirm } = useExpenseDialogs();
  const { toast } = useToast();
  const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortState>({ field: "date", direction: "desc" });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visible = useMemo(
    () => sortExpenses(filterExpenses(expenses, filters), sort),
    [expenses, filters, sort],
  );
  const filteredTotal = useMemo(() => sumAmounts(visible), [visible]);

  const changeFilters = (next: ExpenseFilters) => {
    setFilters(next);
    setVisibleCount(PAGE_SIZE);
  };

  const handleExport = () => {
    try {
      downloadCSV(`expenses-${todayISO()}.csv`, expensesToCSV(visible));
      toast(`Exported ${visible.length} expense${visible.length === 1 ? "" : "s"} to CSV.`);
    } catch {
      toast("Export failed. Please try again.", "error");
    }
  };

  const handleClearAll = () =>
    confirm({
      title: "Delete all expenses?",
      message: `This permanently removes all ${expenses.length} expenses from this browser. Export a CSV first if you want a backup.`,
      confirmLabel: "Delete all",
      onConfirm: () => {
        clearAll();
        toast("All expenses deleted.");
      },
    });

  const loadSample = () => {
    const sample = generateSampleExpenses();
    addExpenses(sample);
    toast(`Loaded ${sample.length} sample expenses.`, "info");
  };

  const hasExpenses = isLoaded && expenses.length > 0;

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Search, filter, edit, and export your expenses."
        actions={
          hasExpenses && (
            <>
              <Button variant="ghost" onClick={handleClearAll}>
                <Trash2 className="h-4 w-4" aria-hidden /> Delete all
              </Button>
              <Button variant="secondary" onClick={handleExport} disabled={visible.length === 0}>
                <Download className="h-4 w-4" aria-hidden /> Export CSV
              </Button>
            </>
          )
        }
      />

      <Card className="overflow-hidden">
        {!isLoaded ? (
          <ListSkeleton />
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            description="Once you add expenses they'll show up here, ready to search, filter, and export."
          >
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" aria-hidden /> Add expense
            </Button>
            <Button variant="secondary" onClick={loadSample}>
              <Sparkles className="h-4 w-4" aria-hidden /> Load sample data
            </Button>
          </EmptyState>
        ) : (
          <>
            <ExpenseFiltersBar filters={filters} onChange={changeFilters} />

            <div
              className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm sm:px-5 md:border-b-0"
              aria-live="polite"
            >
              <span className="text-slate-600">
                {visible.length} of {expenses.length} expense{expenses.length === 1 ? "" : "s"}
              </span>
              <span className="text-slate-600">
                Total <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(filteredTotal)}</span>
              </span>
            </div>

            {visible.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No matching expenses"
                description="Try a different search term, category, or date range."
              >
                <Button variant="secondary" onClick={() => changeFilters(DEFAULT_FILTERS)}>
                  Clear filters
                </Button>
              </EmptyState>
            ) : (
              <>
                <ExpenseList expenses={visible.slice(0, visibleCount)} sort={sort} onSortChange={setSort} />
                {visible.length > visibleCount && (
                  <div className="border-t border-slate-100 p-4 text-center">
                    <Button variant="secondary" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
                      Show more ({visible.length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Card>
    </>
  );
}
