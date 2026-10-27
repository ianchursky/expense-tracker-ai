"use client";

import type { ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipProps } from "recharts";
import { Card, CardHeader } from "@/components/ui/Card";
import { usePrefersReducedMotion } from "@/components/ui/usePrefersReducedMotion";
import type { CategoryTotal } from "@/lib/analytics";
import { CATEGORY_META } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as CategoryTotal;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
      <p className="font-medium text-slate-900">{item.category}</p>
      <p className="text-slate-600 tabular-nums">
        {formatCurrency(item.total)} · {item.percent.toFixed(1)}%
      </p>
    </div>
  );
}

export function CategoryBreakdown({
  data,
  periodLabel,
  action,
}: {
  data: CategoryTotal[];
  periodLabel: string;
  action?: ReactNode;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const total = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <Card className="lg:col-span-2">
      <CardHeader title="Where it went" description={periodLabel} action={action} />
      {data.length === 0 ? (
        <p className="px-5 py-16 text-center text-sm text-slate-600">No expenses in this period.</p>
      ) : (
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center lg:flex-col lg:items-stretch">
          <div className="relative mx-auto h-36 w-36 shrink-0" role="img" aria-label="Donut chart of spending by category; values listed alongside">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="category"
                  innerRadius="72%"
                  outerRadius="100%"
                  paddingAngle={data.length > 1 ? 2 : 0}
                  stroke="none"
                  isAnimationActive={!reducedMotion}
                >
                  {data.map((d) => (
                    <Cell key={d.category} fill={CATEGORY_META[d.category].color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-slate-600">Total</span>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">{formatCurrency(total)}</span>
            </div>
          </div>

          <ul className="min-w-0 flex-1 divide-y divide-slate-100">
            {data.map((d) => (
              <li key={d.category} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2.5 text-slate-700">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: CATEGORY_META[d.category].color }}
                    aria-hidden
                  />
                  <span className="truncate">{d.category}</span>
                </span>
                <span className="shrink-0 tabular-nums">
                  <span className="font-medium text-slate-900">{formatCurrency(d.total)}</span>
                  <span className="ml-2 inline-block w-9 text-right text-slate-600">{d.percent.toFixed(0)}%</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
