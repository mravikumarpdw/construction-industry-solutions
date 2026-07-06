"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatINR } from "@/lib/money";

const PALETTE = ["#f79009", "#0ba5ec", "#12b76a", "#7a5af8", "#f04438", "#64748b"];

export function DonutChart({
  data,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number }[];
  centerLabel?: string;
  centerValue?: string;
}) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={68}
            outerRadius={100}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "rgb(var(--surface))",
              border: "1px solid rgb(var(--border))",
              borderRadius: 12,
              fontSize: 12,
              color: "rgb(var(--fg))",
            }}
            formatter={(v: number, n: string) => [formatINR(v), n]}
          />
        </PieChart>
      </ResponsiveContainer>
      {centerValue && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted">{centerLabel}</span>
          <span className="text-lg font-semibold text-fg">{centerValue}</span>
        </div>
      )}
    </div>
  );
}

export function ChartLegend({ items }: { items: { name: string; color?: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((it, i) => (
        <div key={it.name} className="flex items-center gap-1.5 text-xs text-fg-soft">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ background: it.color ?? PALETTE[i % PALETTE.length] }}
          />
          {it.name}
        </div>
      ))}
    </div>
  );
}
