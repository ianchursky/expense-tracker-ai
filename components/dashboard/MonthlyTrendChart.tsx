"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { Card, CardHeader } from "@/components/ui/Card";
import type { MonthTotal } from "@/lib/analytics";
import { formatCompactCurrency, formatCurrency, formatMonthKey } from "@/lib/format";

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as MonthTotal;
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-sm shadow-lg ring-1 ring-slate-200">
      <p className="font-medium text-slate-900">{formatMonthKey(point.month, "long")}</p>
      <p className="text-slate-600 tabular-nums">{formatCurrency(point.total)}</p>
    </div>
  );
}

export function MonthlyTrendChart({ data }: { data: MonthTotal[] }) {
  const average = data.reduce((sum, d) => sum + d.total, 0) / (data.length || 1);

  return (
    <Card className="lg:col-span-3">
      <CardHeader
        title="Monthly spending"
        description={`Last ${data.length} months · avg ${formatCurrency(average)}/month`}
      />
      <div className="h-72 px-2 pb-4 pt-4" role="img" aria-label="Bar chart of spending per month">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickFormatter={(m: string) => formatMonthKey(m)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(v: number) => formatCompactCurrency(v)}
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "#eef2ff" }} />
            <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
