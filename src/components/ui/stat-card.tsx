"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./counter";
import { formatINR, formatNumber } from "@/lib/money";

type Tone = "brand" | "success" | "danger" | "info" | "neutral";
type FormatType = "inr" | "inrCompact" | "number";

const FORMATTERS: Record<FormatType, (n: number) => string> = {
  inr: (n) => formatINR(n),
  inrCompact: (n) => formatINR(n, { compact: true }),
  number: (n) => formatNumber(n),
};

const toneStyles: Record<Tone, { ring: string; icon: string; glow: string }> = {
  brand: {
    ring: "from-brand-500/20",
    icon: "bg-brand-500/12 text-brand-500",
    glow: "group-hover:shadow-glow",
  },
  success: {
    ring: "from-success/20",
    icon: "bg-success/12 text-success",
    glow: "",
  },
  danger: { ring: "from-danger/20", icon: "bg-danger/12 text-danger", glow: "" },
  info: { ring: "from-info/20", icon: "bg-info/12 text-info", glow: "" },
  neutral: {
    ring: "from-steel-400/20",
    icon: "bg-surface-2 text-fg-soft",
    glow: "",
  },
};

export function StatCard({
  label,
  value,
  format,
  icon,
  tone = "brand",
  sub,
  delta,
}: {
  label: string;
  value: number;
  format?: FormatType;
  icon?: React.ReactNode;
  tone?: Tone;
  sub?: string;
  delta?: { value: string; positive?: boolean };
}) {
  const t = toneStyles[tone];
  const formatter = format ? FORMATTERS[format] : undefined;
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-card transition-shadow",
        t.glow
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-6 -top-10 h-28 w-28 rounded-full bg-gradient-to-b to-transparent blur-2xl",
          t.ring
        )}
      />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-fg">
            <AnimatedNumber value={value} format={formatter} />
          </p>
          {sub && <p className="mt-1 text-xs text-muted truncate">{sub}</p>}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              t.icon
            )}
          >
            {icon}
          </div>
        )}
      </div>
      {delta && (
        <div className="relative mt-3">
          <span
            className={cn(
              "text-xs font-medium",
              delta.positive ? "text-success" : "text-danger"
            )}
          >
            {delta.value}
          </span>
        </div>
      )}
    </motion.div>
  );
}
