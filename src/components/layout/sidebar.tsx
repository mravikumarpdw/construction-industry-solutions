"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { HardHat } from "lucide-react";
import { NAV } from "./nav-config";
import type { ModuleKey } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export function Sidebar({
  allowed,
  onNavigate,
}: {
  allowed: ModuleKey[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const allow = new Set(allowed);

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow">
          <HardHat className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-fg">Construction</p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-brand-500">
            Industry Solutions
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {NAV.map((group) => {
          const items = group.items.filter((i) => allow.has(i.module));
          if (items.length === 0) return null;
          return (
            <div key={group.title}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "text-brand-600"
                          : "text-fg-soft hover:bg-surface-2 hover:text-fg"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 rounded-xl bg-brand-500/10 ring-1 ring-brand-500/20"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <Icon className="relative h-[18px] w-[18px] shrink-0" />
                      <span className="relative">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border px-5 py-3">
        <p className="text-[11px] text-muted">v1.0 · Cost-controlled builds</p>
      </div>
    </div>
  );
}
