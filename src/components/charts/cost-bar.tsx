"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR } from "@/lib/money";

interface Row {
  name: string;
  budget: number;
  committed: number;
  actual: number;
}

export function CostByHeadChart({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "rgb(var(--muted))" }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => formatINR(v, { compact: true })} tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} axisLine={false} tickLine={false} width={64} />
        <Tooltip
          cursor={{ fill: "rgb(var(--surface-2))", opacity: 0.5 }}
          contentStyle={{
            background: "rgb(var(--surface))",
            border: "1px solid rgb(var(--border))",
            borderRadius: 12,
            fontSize: 12,
            color: "rgb(var(--fg))",
          }}
          formatter={(v: number, n: string) => [formatINR(v), n]}
        />
        <Bar dataKey="budget" name="Budget" fill="rgb(var(--muted))" radius={[4, 4, 0, 0]} maxBarSize={26} opacity={0.35} />
        <Bar dataKey="committed" name="Committed" fill="#0ba5ec" radius={[4, 4, 0, 0]} maxBarSize={26} />
        <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]} maxBarSize={26}>
          {data.map((row, i) => (
            <Cell key={i} fill={row.actual + row.committed > row.budget ? "#f04438" : "#f79009"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
