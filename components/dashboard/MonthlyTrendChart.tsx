"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { Card, CardHeader } from "@/components/ui/Card";
import { usePrefersReducedMotion } from "@/components/ui/usePrefersReducedMotion";
import type { MonthTotal } from "@/lib/analytics";
import { formatCompactCurrency, formatCurrency, formatMonthKey } from "@/lib/format";

const ACCENT = "#16a34a";

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as MonthTotal;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
      <p className="font-medium text-slate-900">{formatMonthKey(point.month, "long")}</p>
      <p className="text-slate-600 tabular-nums">{formatCurrency(point.total)}</p>
    </div>
  );
}

export function MonthlyTrendChart({ data }: { data: MonthTotal[] }) {
  const reducedMotion = usePrefersReducedMotion();
  const average = data.reduce((sum, d) => sum + d.total, 0) / (data.length || 1);
  const summary = data.map((d) => `${formatMonthKey(d.month, "long")}: ${formatCurrency(d.total)}`).join("; ");

  return (
    <Card className="flex flex-col lg:col-span-3">
      <CardHeader title="Spending trend" description={`Last ${data.length} months · average ${formatCurrency(average)} a month`} />
      <div className="min-h-[240px] flex-1 px-2 pb-3 pt-4" role="img" aria-label={`Monthly spending. ${summary}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity={0.22} />
                <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="month"
              tickFormatter={(m: string) => formatMonthKey(m)}
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={{ fill: "#64748b", fontSize: 12 }}
              dy={6}
            />
            <YAxis
              tickFormatter={(v: number) => formatCompactCurrency(v)}
              tickLine={false}
              axisLine={false}
              width={52}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }} />
            <Area
              type="monotone"
              dataKey="total"
              stroke={ACCENT}
              strokeWidth={2.5}
              fill="url(#trend-fill)"
              isAnimationActive={!reducedMotion}
              dot={{ r: 3, fill: "#fff", stroke: ACCENT, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: ACCENT, stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
