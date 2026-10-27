"use client";

import { Plus, Sparkles, Wallet } from "lucide-react";
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
import { CategoryBreakdown } from "./CategoryBreakdown";
import { MonthlyTrendChart } from "./MonthlyTrendChart";
import { RecentExpenses } from "./RecentExpenses";
import { SummaryCards } from "./SummaryCards";

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
  const { openAdd } = useExpenseDialogs();
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
            description="Add your first expense to start seeing summaries and charts, or load sample data to explore the app."
          >
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" aria-hidden /> Add expense
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
