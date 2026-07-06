import { cn } from "@/lib/utils";
import { clamp } from "@/lib/utils";

// Budget utilisation / progress bar. Colour shifts to warning/danger as it
// approaches or exceeds 100%.
export function ProgressBar({
  value,
  className,
  showLabel,
  tone,
}: {
  value: number; // 0-100+
  className?: string;
  showLabel?: boolean;
  tone?: "auto" | "brand" | "success";
}) {
  const pct = clamp(value, 0, 100);
  const color =
    tone === "brand"
      ? "bg-brand-500"
      : tone === "success"
        ? "bg-success"
        : value >= 100
          ? "bg-danger"
          : value >= 85
            ? "bg-warning"
            : "bg-success";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-10 text-right text-xs tabular text-fg-soft">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}
