import { clsx } from "clsx";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import type { DashboardSummary } from "@/lib/analytics";
import { CATEGORY_META } from "@/lib/categories";
import { formatCurrency, formatMonthKey, monthKey, toISODate } from "@/lib/format";

function StatCard({ label, value, footer }: { label: string; value: ReactNode; footer: ReactNode }) {
  return (
    <Card className="px-4 py-4 sm:px-5">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1.5 truncate text-2xl font-semibold leading-tight tracking-tight text-slate-900 tabular-nums sm:text-[26px]">
        {value}
      </p>
      <div className="mt-1 truncate text-[13px] text-slate-600 sm:text-sm">{footer}</div>
    </Card>
  );
}

/** Text shown from the `sm` breakpoint up; phones get the shorter form so every footer stays on one line. */
const Wide = ({ children }: { children: ReactNode }) => <span className="hidden sm:inline">{children}</span>;

/** Short name of the previous calendar month, e.g. "Sep". */
function previousMonthName(now = new Date()) {
  return formatMonthKey(monthKey(toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1))));
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  const { monthChange, topCategory } = summary;
  const increased = monthChange !== null && monthChange > 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard
        label="This month"
        value={formatCurrency(summary.thisMonth)}
        footer={
          monthChange === null ? (
            "No spending last month"
          ) : (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <span className={clsx("inline-flex items-center font-medium", increased ? "text-red-700" : "text-brand-700")}>
                {increased ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : <ArrowDownRight className="h-4 w-4" aria-hidden />}
                {Math.abs(monthChange).toFixed(1)}%
              </span>
              vs <span className="sm:hidden">{previousMonthName()}</span>
              <Wide>last month</Wide>
            </span>
          )
        }
      />
      <StatCard
        label="Daily average"
        value={formatCurrency(summary.dailyAverageThisMonth)}
        footer={
          <>
            {plural(summary.thisMonthCount, "expense")}
            <Wide> this month</Wide>
          </>
        }
      />
      <StatCard
        label="Top category"
        value={
          topCategory ? (
            <span className="inline-flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: CATEGORY_META[topCategory.category].color }}
                aria-hidden
              />
              {topCategory.category}
            </span>
          ) : (
            "—"
          )
        }
        footer={
          topCategory ? (
            <>
              {formatCurrency(topCategory.total)} · {topCategory.percent.toFixed(0)}%
              <Wide> of {summary.thisMonthCount > 0 ? "this month" : "all time"}</Wide>
            </>
          ) : (
            "No data yet"
          )
        }
      />
      <StatCard
        label="Total spending"
        value={formatCurrency(summary.total)}
        footer={
          <>
            {plural(summary.count, "expense")}
            <Wide> recorded</Wide>
          </>
        }
      />
    </div>
  );
}
