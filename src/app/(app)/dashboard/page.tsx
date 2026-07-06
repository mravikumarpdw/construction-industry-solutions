import {
  Building2,
  Wallet,
  TrendingUp,
  Users,
  AlertTriangle,
  ClipboardList,
  ArrowUpRight,
  IndianRupee,
} from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectWhere, scopedProjectIds } from "@/lib/scope";
import { portfolioSummary } from "@/lib/cost-ledger";
import { formatINR } from "@/lib/money";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/badge";
import { Reveal, RevealItem } from "@/components/ui/motion";
import { CostByHeadChart } from "@/components/charts/cost-bar";
import { AreaTrend } from "@/components/charts/area-trend";
import { ActivityFeed } from "@/components/activity-feed";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;
  const projectIds = await scopedProjectIds(user);
  const idFilter = user.scopeAll ? undefined : projectIds;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    projects,
    portfolio,
    heads,
    budgetByHead,
    ledgerByHead,
    actualEntries,
    workersToday,
    openIndents,
    pendingRA,
    activity,
    alerts,
  ] = await Promise.all([
    db.project.findMany({
      where: projectWhere(user),
      include: { client: true },
      orderBy: { createdAt: "asc" },
    }),
    portfolioSummary(user.tenantId, projectIds),
    db.costHead.findMany({ where: { tenantId: user.tenantId }, orderBy: { sort: "asc" } }),
    db.budgetLine.groupBy({
      by: ["costHeadId"],
      where: { projectId: { in: projectIds }, approved: true },
      _sum: { amount: true },
    }),
    db.costLedgerEntry.groupBy({
      by: ["costHeadId", "type"],
      where: { projectId: { in: projectIds } },
      _sum: { amount: true },
    }),
    db.costLedgerEntry.findMany({
      where: { projectId: { in: projectIds }, type: "Actual" },
      select: { amount: true, createdAt: true },
    }),
    db.attendancePunch.findMany({
      where: { projectId: { in: projectIds }, date: { gte: startOfToday }, status: { not: "A" } },
      select: { workerId: true },
      distinct: ["workerId"],
    }),
    db.indent.count({ where: { projectId: { in: projectIds }, status: { in: ["Raised", "Approved"] } } }),
    db.raBill.count({ where: { projectId: { in: projectIds }, status: "Submitted" } }),
    db.activityEvent.findMany({
      where: { tenantId: user.tenantId, ...(idFilter ? { projectId: { in: idFilter } } : {}) },
      orderBy: { createdAt: "desc" },
      take: 9,
    }),
    db.alert.findMany({
      where: { tenantId: user.tenantId, isResolved: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  // Cost-by-head chart data
  const chartData = heads.map((h) => {
    const budget = budgetByHead.find((b) => b.costHeadId === h.id)?._sum.amount ?? 0;
    const committed = ledgerByHead.find((l) => l.costHeadId === h.id && l.type === "Committed")?._sum.amount ?? 0;
    const actual = ledgerByHead.find((l) => l.costHeadId === h.id && l.type === "Actual")?._sum.amount ?? 0;
    return { name: h.name, budget, committed: Math.max(0, committed), actual };
  });

  // Monthly actual-cost trend (bucket in JS)
  const monthMap = new Map<string, number>();
  for (const e of actualEntries) {
    const key = e.createdAt.toLocaleDateString("en-IN", { month: "short" });
    monthMap.set(key, (monthMap.get(key) ?? 0) + e.amount);
  }
  const order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trendData = Array.from(monthMap.entries())
    .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
    .map(([name, value]) => ({ name, value: Math.round(value) }));

  const contractValue = projects.reduce((s, p) => s + p.contractValue, 0);
  const totalCost = portfolio.committed + portfolio.actual;
  const margin = contractValue - totalCost;
  const marginPct = contractValue > 0 ? (margin / contractValue) * 100 : 0;

  // Per-project summaries
  const projectSummaries = await Promise.all(
    projects.map(async (p) => {
      const [bl, led] = await Promise.all([
        db.budgetLine.aggregate({ where: { projectId: p.id, approved: true }, _sum: { amount: true } }),
        db.costLedgerEntry.groupBy({ by: ["type"], where: { projectId: p.id }, _sum: { amount: true } }),
      ]);
      const budget = bl._sum.amount ?? 0;
      const committed = led.find((l) => l.type === "Committed")?._sum.amount ?? 0;
      const actual = led.find((l) => l.type === "Actual")?._sum.amount ?? 0;
      const util = budget > 0 ? ((committed + actual) / budget) * 100 : 0;
      return { ...p, budget, committed, actual, util };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted">Welcome back, {user.name.split(" ")[0]}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">
          Portfolio Command Centre
        </h1>
      </div>

      {/* KPI row */}
      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Contract Value" value={contractValue} format="inrCompact" icon={<IndianRupee className="h-5 w-5" />} tone="brand" />
        <StatCard label="Actual Cost" value={portfolio.actual} format="inrCompact" icon={<Wallet className="h-5 w-5" />} tone="info" />
        <StatCard label="Committed" value={portfolio.committed} format="inrCompact" icon={<ClipboardList className="h-5 w-5" />} tone="neutral" />
        <StatCard label="Est. Margin" value={margin} format="inrCompact" icon={<TrendingUp className="h-5 w-5" />} tone={margin >= 0 ? "success" : "danger"} sub={`${marginPct.toFixed(1)}% of contract`} />
        <StatCard label="Active Projects" value={projects.filter((p) => p.status === "Active").length} icon={<Building2 className="h-5 w-5" />} tone="brand" />
        <StatCard label="On Site Today" value={workersToday.length} icon={<Users className="h-5 w-5" />} tone="success" sub={`${openIndents} open indents · ${pendingRA} bills to approve`} />
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cost control chart */}
        <RevealItem className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Cost Control — Budget vs Committed vs Actual</CardTitle>
                <p className="mt-0.5 text-xs text-muted">
                  The single ledger every module posts into (SRS §7.7)
                </p>
              </div>
              <div className="hidden items-center gap-4 sm:flex">
                <Legend color="rgb(var(--muted))" label="Budget" />
                <Legend color="#0ba5ec" label="Committed" />
                <Legend color="#f79009" label="Actual" />
              </div>
            </CardHeader>
            <CardBody>
              <CostByHeadChart data={chartData} />
            </CardBody>
          </Card>
        </RevealItem>

        {/* Alerts */}
        <RevealItem>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" /> Exception Alerts
              </CardTitle>
              <Link href="/reports" className="text-xs font-medium text-brand-500 hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardBody className="space-y-2">
              {alerts.length === 0 && <p className="text-sm text-muted">All clear — no open alerts.</p>}
              {alerts.map((a) => (
                <div key={a.id} className="rounded-xl border border-border bg-surface-2/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-fg">{a.title}</p>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${a.severity === "high" || a.severity === "critical" ? "bg-danger" : a.severity === "medium" ? "bg-warning" : "bg-info"}`} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{a.message}</p>
                </div>
              ))}
            </CardBody>
          </Card>
        </RevealItem>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Projects table */}
        <RevealItem className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Projects — Cost Utilisation</CardTitle>
              <Link href="/projects" className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:underline">
                All projects <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardBody className="space-y-4">
              {projectSummaries.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="block rounded-xl border border-border p-4 transition-colors hover:border-brand-300 hover:bg-surface-2/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-fg">{p.name}</p>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="text-xs text-muted">{p.code} · {p.location} · {p.client?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-fg tabular">{formatINR(p.contractValue, { compact: true })}</p>
                      <p className="text-xs text-muted">contract</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={p.util} showLabel />
                    <div className="mt-1.5 flex justify-between text-xs text-muted">
                      <span>Budget {formatINR(p.budget, { compact: true })}</span>
                      <span>Actual {formatINR(p.actual, { compact: true })} · Committed {formatINR(p.committed, { compact: true })}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </CardBody>
          </Card>
        </RevealItem>

        {/* Activity feed */}
        <RevealItem>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Live Activity</CardTitle>
              <Link href="/activity" className="text-xs font-medium text-brand-500 hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardBody>
              <ActivityFeed items={activity} />
            </CardBody>
          </Card>
        </RevealItem>
      </div>

      {/* Trend */}
      <RevealItem>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Actual Cost Trend</CardTitle>
            <p className="text-xs text-muted">Cost booked across all in-scope projects</p>
          </CardHeader>
          <CardBody>
            <AreaTrend data={trendData} />
          </CardBody>
        </Card>
      </RevealItem>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-fg-soft">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </div>
  );
}
