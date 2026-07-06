"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TabItem {
  key: string;
  label: string;
  count?: number;
  content: React.ReactNode;
}

export function Tabs({ items, className }: { items: TabItem[]; className?: string }) {
  const [active, setActive] = useState(items[0]?.key);
  const current = items.find((i) => i.key === active) ?? items[0];

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => setActive(it.key)}
            className={cn(
              "relative rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
              active === it.key ? "text-fg" : "text-muted hover:text-fg"
            )}
          >
            {active === it.key && (
              <motion.span
                layoutId="tab-active"
                className="absolute inset-0 rounded-lg bg-surface-2 ring-1 ring-border"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {it.label}
              {it.count != null && (
                <span className="rounded-full bg-brand-500/15 px-1.5 text-xs text-brand-600">
                  {it.count}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
      <motion.div
        key={current?.key}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {current?.content}
      </motion.div>
    </div>
  );
}
