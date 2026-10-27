"use client";

import { FileUp, Plus, Sparkles, Wallet } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useExpenseDialogs } from "@/components/providers/ExpenseDialogProvider";
import { useExpenses } from "@/components/providers/ExpenseProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Card, Skeleton } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { getDashboardSummary, monthlyTotals, sortExpenses, totalsByCategory } from "@/lib/analytics";
import { monthKey, todayISO } from "@/lib/format";
import { RecentExpenses } from "./RecentExpenses";
import { SummaryCards } from "./SummaryCards";

// Recharts is most of this page's JavaScript; load it after the summary and transactions render.
// The placeholders match each card's footprint so nothing shifts when the charts arrive.
const MonthlyTrendChart = dynamic(() => import("./MonthlyTrendChart").then((m) => m.MonthlyTrendChart), {
  ssr: false,
  loading: () => <Skeleton className="h-80 rounded-xl lg:col-span-3" />,
});
const CategoryBreakdown = dynamic(() => import("./CategoryBreakdown").then((m) => m.CategoryBreakdown), {
  ssr: false,
  loading: () => <Skeleton className="h-80 rounded-xl lg:col-span-2" />,
});

type CategoryPeriod = "month" | "all";

const PERIOD_OPTIONS: { id: CategoryPeriod; label: string }[] = [
  { id: "month", label: "This month" },
  { id: "all", label: "All time" },
];

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-6 h-4 w-72" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[108px] rounded-xl" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-80 rounded-xl lg:col-span-3" />
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
      </div>
    </div>
  );
}

export function DashboardView() {
  const { expenses, isLoaded, loadSampleData } = useExpenses();
  const { openAdd, openImport } = useExpenseDialogs();
  const { toast } = useToast();
  const [period, setPeriod] = useState<CategoryPeriod>("month");

  const summary = useMemo(() => getDashboardSummary(expenses), [expenses]);
  const monthly = useMemo(() => monthlyTotals(expenses, 6), [expenses]);
  const categoryData = useMemo(() => {
    const currentMonth = monthKey(todayISO());
    const scoped = period === "month" ? expenses.filter((e) => monthKey(e.date) === currentMonth) : expenses;
    return totalsByCategory(scoped);
  }, [expenses, period]);
  const recent = useMemo(
    () => sortExpenses(expenses, { field: "date", direction: "desc" }).slice(0, 5),
    [expenses],
  );

  if (!isLoaded) return <DashboardSkeleton />;

  const loadSample = () => {
    toast(`Loaded ${loadSampleData()} sample expenses.`, "info");
  };

  if (expenses.length === 0) {
    return (
      <>
        <PageHeader title="Dashboard" description="An overview of your spending." />
        <Card>
          <EmptyState
            icon={Wallet}
            title="No expenses yet"
            description="No account needed: everything you enter stays in this browser. Add your first expense, restore a CSV backup, or load sample data to look around."
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
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Dashboard" description="An overview of your spending." />
      <SummaryCards summary={summary} />
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <MonthlyTrendChart data={monthly} />
        <CategoryBreakdown
          data={categoryData}
          periodLabel={period === "month" ? "Spending this month" : "Spending across all time"}
          action={<SegmentedControl label="Category period" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />}
        />
      </div>
      <div className="mt-4">
        <RecentExpenses expenses={recent} />
      </div>
    </>
  );
}
