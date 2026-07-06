import {
  Smartphone,
  Globe,
  Cpu,
  Users,
  Package,
  Truck,
  FileText,
  Receipt,
  ShoppingCart,
  HardHat,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";

const TYPE_ICON: Record<string, typeof Users> = {
  attendance: Users,
  wages: Users,
  material: Package,
  grn: Package,
  issue: Package,
  po: ShoppingCart,
  indent: ShoppingCart,
  wo: HardHat,
  rabill: Receipt,
  payment: Receipt,
  progress: TrendingUp,
  mb: ClipboardCheck,
  ncr: ClipboardCheck,
  equipment: Truck,
  document: FileText,
};

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  detail?: string | null;
  source: string;
  actorName?: string | null;
  projectName?: string | null;
  lat?: number | null;
  lng?: number | null;
  createdAt: Date;
}

function SourceBadge({ source }: { source: string }) {
  if (source === "MOBILE")
    return (
      <Badge tone="info" className="gap-1">
        <Smartphone className="h-3 w-3" /> Mobile
      </Badge>
    );
  if (source === "SYSTEM")
    return (
      <Badge tone="purple" className="gap-1">
        <Cpu className="h-3 w-3" /> System
      </Badge>
    );
  return (
    <Badge tone="neutral" className="gap-1">
      <Globe className="h-3 w-3" /> Web
    </Badge>
  );
}

export function ActivityFeed({
  items,
  showProject,
}: {
  items: ActivityItem[];
  showProject?: boolean;
}) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">No activity yet.</p>;
  }
  return (
    <ul className="space-y-1">
      {items.map((it) => {
        const Icon = TYPE_ICON[it.type] ?? Globe;
        const mobile = it.source === "MOBILE";
        return (
          <li
            key={it.id}
            className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-2/60"
          >
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                mobile ? "bg-info/12 text-info" : "bg-surface-2 text-fg-soft"
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-fg">{it.title}</p>
                <SourceBadge source={it.source} />
              </div>
              <p className="truncate text-xs text-muted">
                {it.actorName && <span>{it.actorName}</span>}
                {it.detail && <span> · {it.detail}</span>}
                {showProject && it.projectName && <span> · {it.projectName}</span>}
                {mobile && it.lat != null && (
                  <span> · 📍 {it.lat.toFixed(4)}, {it.lng?.toFixed(4)}</span>
                )}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted">{timeAgo(it.createdAt)}</span>
          </li>
        );
      })}
    </ul>
  );
}
