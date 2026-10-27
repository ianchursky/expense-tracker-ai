"use client";

import type { ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipProps } from "recharts";
import { Card, CardHeader } from "@/components/ui/Card";
import type { CategoryTotal } from "@/lib/analytics";
import { CATEGORY_META } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as CategoryTotal;
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-sm shadow-lg ring-1 ring-slate-200">
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
  const total = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <Card className="lg:col-span-2">
      <CardHeader title="By category" description={periodLabel} action={action} />
      {data.length === 0 ? (
        <p className="px-5 py-16 text-center text-sm text-slate-500">No expenses in this period.</p>
      ) : (
        <div className="p-5">
          <div className="relative mx-auto h-44 w-44" role="img" aria-label="Donut chart of spending by category">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="category"
                  innerRadius="68%"
                  outerRadius="100%"
                  paddingAngle={data.length > 1 ? 2 : 0}
                  stroke="none"
                >
                  {data.map((d) => (
                    <Cell key={d.category} fill={CATEGORY_META[d.category].color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-slate-500">Total</span>
              <span className="text-base font-bold text-slate-900 tabular-nums">{formatCurrency(total)}</span>
            </div>
          </div>

          <ul className="mt-5 space-y-2.5">
            {data.map((d) => (
              <li key={d.category} className="text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: CATEGORY_META[d.category].color }}
                      aria-hidden
                    />
                    {d.category}
                  </span>
                  <span className="font-medium text-slate-900 tabular-nums">
                    {formatCurrency(d.total)}
                    <span className="ml-2 inline-block w-10 text-right font-normal text-slate-500">
                      {d.percent.toFixed(0)}%
                    </span>
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${d.percent}%`, backgroundColor: CATEGORY_META[d.category].color }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
