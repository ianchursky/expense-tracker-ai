"use client";

import { Plus, Receipt, SearchX, Share2, Sparkles, Trash2 } from "lucide-react";
import { ChevronDown, Database, Download, FileDown, FileUp, Plus, Receipt, SearchX, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useExpenseDialogs } from "@/components/providers/ExpenseDialogProvider";
import { useExpenses } from "@/components/providers/ExpenseProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card, Skeleton } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Menu } from "@/components/ui/Menu";
import { PageHeader } from "@/components/ui/PageHeader";
import { ExportSheet } from "@/components/export/ExportSheet";
import { DEFAULT_FILTERS, filterExpenses, sortExpenses, sumAmounts } from "@/lib/analytics";
import { ExportComposer } from "@/components/cloud/ExportComposer";
import type { ExportScope } from "@/lib/export";
import { formatCurrency } from "@/lib/format";
import { generateSampleExpenses } from "@/lib/sampleData";
import { CATEGORIES, type ExpenseFilters, type SortState } from "@/lib/types";
import { downloadCSV, expensesToCSV } from "@/lib/csv";
import { formatCurrency, formatDate, todayISO } from "@/lib/format";
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

/** Empty-results copy that repeats back exactly what was searched, so the next step is obvious. */
function describeNoResults(filters: ExpenseFilters): { title: string; description: string } {
  const query = filters.search.trim();
  const what = filters.category === "All" ? "all expenses" : `${filters.category} expenses`;
  const { startDate, endDate } = filters;
  const when =
    startDate && endDate
      ? ` from ${formatDate(startDate)} to ${formatDate(endDate)}`
      : startDate
        ? ` from ${formatDate(startDate)} on`
        : endDate
          ? ` through ${formatDate(endDate)}`
          : "";
  const narrowed = filters.category !== "All" || when !== "";

  const searched = query || narrowed ? `Searched ${what}${when}. ` : "";
  const hint = query ? "Check the spelling or try a shorter search" : "Try a different category or date range";
  return {
    title: query ? `No expenses match “${query}”` : "No matching expenses",
    description: `${searched}${hint}${narrowed && query ? ", or clear the filters." : "."}`,
  };
}

export function ExpensesView() {
  const { expenses, isLoaded, loadSampleData } = useExpenses();
  const { openAdd, openImport, exportAll, requestDeleteAll } = useExpenseDialogs();
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

  const [composerOpen, setComposerOpen] = useState(false);

  const handleClearAll = () =>
    confirm({
      title: "Delete all expenses?",
      message: `This permanently removes all ${expenses.length} expenses from this browser. Export a Full Backup first if you want to keep a copy.`,
      confirmLabel: "Delete all",
      onConfirm: () => {
        clearAll();
        toast("All expenses deleted.");
      },
    });

  const [exportOpen, setExportOpen] = useState(false);
  // The export starts from the list's date and category filters; search text is a lookup aid, not a scope.
  const exportScope: ExportScope = {
    startDate: filters.startDate,
    endDate: filters.endDate,
    categories: filters.category === "All" ? [...CATEGORIES] : [filters.category],
  const handleExport = () => {
    // An unfiltered export is a full backup; route it through exportAll so the backup status updates.
    if (visible.length === expenses.length) return exportAll();
    try {
      downloadCSV(`expenses-${todayISO()}.csv`, expensesToCSV(visible));
      toast(`Exported ${visible.length} expense${visible.length === 1 ? "" : "s"} to CSV.`);
    } catch {
      toast("Export failed. Please try again.", "error");
    }
  };

  const loadSample = () => {
    toast(`Loaded ${loadSampleData()} sample expenses.`, "info");
  };

  const hasExpenses = isLoaded && expenses.length > 0;
  const noResults = describeNoResults(filters);
  const isFiltered = visible.length !== expenses.length;

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
              <Button variant="secondary" onClick={() => setComposerOpen(true)} aria-haspopup="dialog">
                <Share2 className="h-4 w-4" aria-hidden /> Export &amp; share
              <Button variant="secondary" onClick={() => setExportOpen(true)} aria-haspopup="dialog">
                <Download className="h-4 w-4" aria-hidden /> Export…
              <Button variant="secondary" onClick={handleExport} disabled={visible.length === 0}>
                <Download className="h-4 w-4" aria-hidden />
                {isFiltered ? `Export ${visible.length.toLocaleString()} shown` : "Export CSV"}
              </Button>
              <Menu
                label="Data"
                triggerClassName={buttonClasses("secondary")}
                trigger={
                  <>
                    <Database className="h-4 w-4" aria-hidden /> Data
                    <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden />
                  </>
                }
                items={[
                  { label: "Import CSV…", icon: FileUp, onSelect: openImport },
                  { label: "Export all expenses", icon: FileDown, onSelect: exportAll },
                  "separator",
                  { label: "Delete all expenses…", icon: Trash2, danger: true, onSelect: requestDeleteAll },
                ]}
              />
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
            <Button variant="secondary" onClick={openImport}>
              <FileUp className="h-4 w-4" aria-hidden /> Import CSV
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
                title={noResults.title}
                description={noResults.description}
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

      <ExportComposer open={composerOpen} onClose={() => setComposerOpen(false)} preset={{}} />
      <ExportSheet open={exportOpen} onClose={() => setExportOpen(false)} initialScope={exportScope} />
    </>
  );
}
