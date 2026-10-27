import { clsx } from "clsx";
import { CalendarDays, PieChart, TrendingDown, TrendingUp, Wallet, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CATEGORY_META } from "@/lib/categories";
import type { DashboardSummary } from "@/lib/analytics";
import { formatCurrency } from "@/lib/format";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClass: string;
  footer: React.ReactNode;
}

function StatCard({ label, value, icon: Icon, iconClass, footer }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={clsx("flex h-9 w-9 items-center justify-center rounded-lg", iconClass)}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
      <div className="mt-1 text-sm text-slate-500">{footer}</div>
    </Card>
  );
}

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  const { monthChange, topCategory } = summary;
  const increased = monthChange !== null && monthChange > 0;
  const TopIcon = topCategory ? CATEGORY_META[topCategory.category].icon : PieChart;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total spending"
        value={formatCurrency(summary.total)}
        icon={Wallet}
        iconClass="bg-brand-100 text-brand-600"
        footer={`${summary.count} expense${summary.count === 1 ? "" : "s"} recorded`}
      />
      <StatCard
        label="This month"
        value={formatCurrency(summary.thisMonth)}
        icon={CalendarDays}
        iconClass="bg-sky-100 text-sky-600"
        footer={
          monthChange === null ? (
            "No spending last month"
          ) : (
            <span className="inline-flex items-center gap-1">
              <span
                className={clsx(
                  "inline-flex items-center gap-0.5 font-medium",
                  increased ? "text-red-600" : "text-emerald-600",
                )}
              >
                {increased ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {Math.abs(monthChange).toFixed(1)}%
              </span>
              vs. last month
            </span>
          )
        }
      />
      <StatCard
        label="Daily average"
        value={formatCurrency(summary.dailyAverageThisMonth)}
        icon={TrendingUp}
        iconClass="bg-amber-100 text-amber-600"
        footer={`${summary.thisMonthCount} expense${summary.thisMonthCount === 1 ? "" : "s"} this month`}
      />
      <StatCard
        label="Top category"
        value={topCategory ? topCategory.category : "—"}
        icon={TopIcon}
        iconClass={topCategory ? CATEGORY_META[topCategory.category].iconClass : "bg-slate-100 text-slate-600"}
        footer={
          topCategory
            ? `${formatCurrency(topCategory.total)} · ${topCategory.percent.toFixed(0)}% of ${
                summary.thisMonthCount > 0 ? "this month" : "all time"
              }`
            : "No data yet"
        }
      />
    </div>
  );
}
