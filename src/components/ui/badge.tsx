import { cn } from "@/lib/utils";

type Tone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-fg-soft border-border",
  brand: "bg-brand-500/10 text-brand-600 border-brand-500/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  info: "bg-info/10 text-info border-info/20",
  purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

// Map common domain statuses → tone so tables read consistently.
export function statusTone(status: string): Tone {
  const s = status.toLowerCase();
  if (/(approved|active|received|closed|paid|achieved|pass|accepted|certified|won|completed)/.test(s))
    return "success";
  if (/(pending|draft|raised|submitted|bidding|planned|in progress|partially|not started|booked|open|assigned)/.test(s))
    return "warning";
  if (/(rejected|cancelled|lost|fail|delayed|breakdown|slipped|hold|critical|overrun|breach)/.test(s))
    return "danger";
  if (/(ordered|deployed|quality hold|rectified|verified|identified|submitted)/.test(s))
    return "info";
  return "neutral";
}

export function Badge({
  children,
  tone = "neutral",
  className,
  dot,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)} dot>{status}</Badge>;
}
