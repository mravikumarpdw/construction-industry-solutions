// Money helpers — V-06: bill math is system-computed, rounded to 2 decimals
// with a documented method (half-up).

export function money(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function pct(base: number, percentage: number): number {
  return money((base * percentage) / 100);
}

// Indian numbering format for display (₹12,34,567.00)
export function formatINR(n: number, opts?: { compact?: boolean }): string {
  const value = Number(n) || 0;
  if (opts?.compact) {
    const abs = Math.abs(value);
    if (abs >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`;
    if (abs >= 1e5) return `₹${(value / 1e5).toFixed(2)} L`;
    if (abs >= 1e3) return `₹${(value / 1e3).toFixed(1)} K`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-IN").format(Number(n) || 0);
}
