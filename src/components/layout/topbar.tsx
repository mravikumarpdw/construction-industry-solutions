"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, LogOut, ChevronDown, Bell, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { initials } from "@/lib/utils";

export function Topbar({
  user,
  tenantName,
  alertCount,
  onMenu,
}: {
  user: { name: string; roleName: string; avatarUrl?: string | null };
  tenantName: string;
  alertCount: number;
  onMenu: () => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border glass px-4 sm:px-6">
      <button
        onClick={onMenu}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-fg-soft lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="hidden items-center gap-2 rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-sm text-muted sm:flex md:w-72">
        <Search className="h-4 w-4" />
        <span className="truncate">Search projects, indents, bills…</span>
        <kbd className="ml-auto rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted">⌘K</kbd>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <a
          href="/reports#alerts"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border text-fg-soft transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <Bell className="h-4 w-4" />
          {alertCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </a>

        <ThemeToggle />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2 py-1.5 transition-colors hover:bg-surface-2"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/15 text-xs font-semibold text-brand-600">
              {initials(user.name)}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-xs font-semibold text-fg">
                {user.name}
              </span>
              <span className="block text-[11px] text-muted">
                {user.roleName}
              </span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-card-lg"
                >
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-fg">{user.name}</p>
                    <p className="text-xs text-muted">{tenantName}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-danger transition-colors hover:bg-surface-2"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
