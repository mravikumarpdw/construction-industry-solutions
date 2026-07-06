import { Activity, Smartphone, Globe, CalendarClock, Layers } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { scopedProjectIds } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Reveal } from "@/components/ui/motion";
import { ActivityFeed, type ActivityItem } from "@/components/activity-feed";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: { source?: string };
}) {
  const user = (await getCurrentUser())!;
  const projectIds = await scopedProjectIds(user);
  const idFilter = user.scopeAll ? undefined : projectIds;

  const rawSource = searchParams.source;
  const source =
    rawSource === "MOBILE" || rawSource === "WEB" ? rawSource : undefined;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const scopeWhere = {
    tenantId: user.tenantId,
    ...(idFilter ? { projectId: { in: idFilter } } : {}),
  };

  const [events, projects, totalCount, mobileCount, webCount, todayCount] =
    await Promise.all([
      db.activityEvent.findMany({
        where: { ...scopeWhere, ...(source ? { source } : {}) },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.project.findMany({
        where: { tenantId: user.tenantId },
        select: { id: true, name: true },
      }),
      db.activityEvent.count({ where: scopeWhere }),
      db.activityEvent.count({ where: { ...scopeWhere, source: "MOBILE" } }),
      db.activityEvent.count({ where: { ...scopeWhere, source: "WEB" } }),
      db.activityEvent.count({
        where: { ...scopeWhere, createdAt: { gte: startOfToday } },
      }),
    ]);

  const projectName = new Map(projects.map((p) => [p.id, p.name]));

  const items: ActivityItem[] = events.map((e) => ({
    id: e.id,
    type: e.type,
    title: e.title,
    detail: e.detail,
    source: e.source,
    actorName: e.actorName,
    createdAt: e.createdAt,
    lat: e.lat,
    lng: e.lng,
    projectName: e.projectId ? projectName.get(e.projectId) ?? null : null,
  }));

  const chips = [
    { key: undefined, label: "All", href: "/activity" },
    { key: "MOBILE", label: "Mobile", href: "/activity?source=MOBILE" },
    { key: "WEB", label: "Web", href: "/activity?source=WEB" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Feed"
        subtitle="Every action across web and mobile, in real time"
        icon={<Activity className="h-5 w-5" />}
      />

      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Events"
          value={totalCount}
          format="number"
          icon={<Layers className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="From Mobile"
          value={mobileCount}
          format="number"
          icon={<Smartphone className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="From Web"
          value={webCount}
          format="number"
          icon={<Globe className="h-5 w-5" />}
          tone="neutral"
        />
        <StatCard
          label="Today"
          value={todayCount}
          format="number"
          icon={<CalendarClock className="h-5 w-5" />}
          tone="success"
        />
      </Reveal>

      <div className="flex items-center gap-2">
        {chips.map((c) => {
          const active = source === c.key || (!source && c.key === undefined);
          return (
            <Link
              key={c.label}
              href={c.href}
              className={cn(
                "inline-flex h-8 items-center rounded-full border px-4 text-xs font-medium transition-colors",
                active
                  ? "border-brand-500/20 bg-brand-500/10 text-brand-600"
                  : "border-border bg-surface-2/40 text-fg-soft hover:border-brand-300"
              )}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      <Card>
        <CardBody>
          <ActivityFeed items={items} showProject />
        </CardBody>
      </Card>
    </div>
  );
}
