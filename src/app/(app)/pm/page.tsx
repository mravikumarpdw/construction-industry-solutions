import {
  GanttChartSquare,
  ListTree,
  Flag,
  ClipboardList,
  Activity,
  TrendingUp,
  Timer,
  AlertTriangle,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { txWhere, scopedProjectIds } from "@/lib/scope";
import { formatDate } from "@/lib/utils";
import { formatNumber } from "@/lib/money";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TR, TH, TD } from "@/components/ui/table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress";
import { Reveal } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

function SourceBadge({ source }: { source: string }) {
  const tone =
    source === "MOBILE" ? "info" : source === "SYSTEM" ? "purple" : "neutral";
  return <Badge tone={tone}>{source}</Badge>;
}

export default async function PmPage() {
  const user = (await getCurrentUser())!;
  const projectIds = await scopedProjectIds(user);
  const taskWhere = { projectId: { in: projectIds } };

  const [
    totalTasks,
    inProgress,
    completed,
    delayed,
    notStarted,
    progressAgg,
    tasks,
    milestones,
    dprs,
  ] = await Promise.all([
    db.task.count({ where: taskWhere }),
    db.task.count({ where: { ...taskWhere, status: "In Progress" } }),
    db.task.count({ where: { ...taskWhere, status: "Completed" } }),
    db.task.count({ where: { ...taskWhere, status: "Delayed" } }),
    db.task.count({ where: { ...taskWhere, status: "Not Started" } }),
    db.task.aggregate({ where: taskWhere, _avg: { progress: true } }),
    db.task.findMany({
      where: taskWhere,
      include: { project: true, boqItem: true },
      orderBy: [{ projectId: "asc" }, { sort: "asc" }],
      take: 120,
    }),
    db.milestone.findMany({
      where: taskWhere,
      include: { project: true },
      orderBy: { targetDate: "asc" },
    }),
    db.progressUpdate.findMany({
      where: txWhere(user),
      include: { task: true },
      orderBy: { date: "desc" },
      take: 40,
    }),
  ]);

  const avgProgress = Math.round(progressAgg._avg.progress ?? 0);
  const achievedMilestones = milestones.filter(
    (m) => m.status === "Achieved"
  ).length;

  const healthTiles = [
    { label: "Not Started", value: notStarted, icon: Timer, tone: "text-muted" },
    { label: "In Progress", value: inProgress, icon: Activity, tone: "text-info" },
    { label: "Completed", value: completed, icon: CheckCircle2, tone: "text-success" },
    { label: "Delayed", value: delayed, icon: AlertTriangle, tone: "text-danger" },
  ];

  const tasksTab = (
    <Card>
      <CardHeader>
        <CardTitle>Work Breakdown Structure — Tasks</CardTitle>
        <span className="text-xs text-muted">{tasks.length} shown</span>
      </CardHeader>
      <CardBody className="p-0">
        {tasks.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<ListTree className="h-5 w-5" />}
              title="No tasks yet"
              description="WBS activities will appear here once the schedule is planned."
            />
          </div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>WBS Code</TH>
                <TH>Task</TH>
                <TH>Project</TH>
                <TH>Planned End</TH>
                <TH>Status</TH>
                <TH className="w-56">Progress</TH>
              </TR>
            </THead>
            <tbody>
              {tasks.map((t) => (
                <TR key={t.id}>
                  <TD className="font-medium text-fg tabular">
                    {t.wbsCode ?? "—"}
                  </TD>
                  <TD>
                    <span className="font-medium text-fg">{t.name}</span>
                    {t.boqItem && (
                      <span className="block text-xs text-muted">
                        BOQ {t.boqItem.code}
                      </span>
                    )}
                  </TD>
                  <TD>{t.project.name}</TD>
                  <TD>{formatDate(t.plannedEnd)}</TD>
                  <TD>
                    <StatusBadge status={t.status} />
                  </TD>
                  <TD className="w-56">
                    <ProgressBar value={t.progress} showLabel />
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );

  const milestonesTab = (
    <Card>
      <CardHeader>
        <CardTitle>Milestones</CardTitle>
        <span className="text-xs text-muted">
          {achievedMilestones}/{milestones.length} achieved
        </span>
      </CardHeader>
      <CardBody className="p-0">
        {milestones.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Flag className="h-5 w-5" />}
              title="No milestones defined"
              description="Contractual and billing milestones will be listed here."
            />
          </div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Milestone</TH>
                <TH>Project</TH>
                <TH>Target</TH>
                <TH>Actual</TH>
                <TH>Status</TH>
                <TH>Billing stage</TH>
              </TR>
            </THead>
            <tbody>
              {milestones.map((m) => (
                <TR key={m.id}>
                  <TD className="font-medium text-fg">{m.name}</TD>
                  <TD>{m.project.name}</TD>
                  <TD>{formatDate(m.targetDate)}</TD>
                  <TD>{formatDate(m.actualDate)}</TD>
                  <TD>
                    <StatusBadge status={m.status} />
                  </TD>
                  <TD>
                    {m.billingStage ? (
                      <Badge tone="purple">Billing</Badge>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );

  const dprTab = (
    <Card>
      <CardHeader>
        <CardTitle>Daily Progress Reports</CardTitle>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Smartphone className="h-3.5 w-3.5" />
          DPRs are filed from the site mobile app (source MOBILE)
        </span>
      </CardHeader>
      <CardBody className="p-0">
        {dprs.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<ClipboardList className="h-5 w-5" />}
              title="No progress updates yet"
              description="Daily site reports posted from the mobile app will appear here."
            />
          </div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Date</TH>
                <TH>Task</TH>
                <TH align="right">Qty Today</TH>
                <TH align="right">Manpower</TH>
                <TH>Machinery</TH>
                <TH>Weather</TH>
                <TH>Source</TH>
                <TH>Remarks</TH>
              </TR>
            </THead>
            <tbody>
              {dprs.map((d) => (
                <TR key={d.id}>
                  <TD className="whitespace-nowrap">{formatDate(d.date)}</TD>
                  <TD className="font-medium text-fg">{d.task.name}</TD>
                  <TD align="right">{formatNumber(d.qtyToday)}</TD>
                  <TD align="right">{formatNumber(d.manpower)}</TD>
                  <TD>{d.machinery ?? "—"}</TD>
                  <TD>{d.weather ?? "—"}</TD>
                  <TD>
                    <SourceBadge source={d.source} />
                  </TD>
                  <TD className="max-w-xs truncate">{d.remarks ?? "—"}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Management"
        subtitle="WBS, task progress, milestones and daily site reporting"
        icon={<GanttChartSquare className="h-5 w-5" />}
      />

      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Tasks"
          value={totalTasks}
          format="number"
          icon={<ListTree className="h-5 w-5" />}
          tone="neutral"
        />
        <StatCard
          label="In Progress"
          value={inProgress}
          format="number"
          icon={<Activity className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="Delayed"
          value={delayed}
          format="number"
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="danger"
        />
        <StatCard
          label="Avg Physical Progress %"
          value={avgProgress}
          format="number"
          icon={<TrendingUp className="h-5 w-5" />}
          tone="brand"
          sub="Weighted physical completion across tasks"
        />
      </Reveal>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Health</CardTitle>
          <span className="text-xs text-muted">
            {avgProgress}% avg physical progress
          </span>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {healthTiles.map((h) => {
              const Icon = h.icon;
              return (
                <div
                  key={h.label}
                  className="rounded-xl border border-border bg-surface-2/40 p-4"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${h.tone}`} />
                    <span className="text-xs font-medium uppercase tracking-wide text-muted">
                      {h.label}
                    </span>
                  </div>
                  <p className="mt-2 text-xl font-semibold text-fg tabular">
                    {formatNumber(h.value)}
                  </p>
                </div>
              );
            })}
          </div>
          <div>
            <div className="mb-1.5 flex justify-between text-xs text-muted">
              <span>Overall physical progress</span>
              <span>{avgProgress}%</span>
            </div>
            <ProgressBar value={avgProgress} tone="brand" />
          </div>
        </CardBody>
      </Card>

      <Tabs
        items={[
          { key: "tasks", label: "Tasks / WBS", count: totalTasks, content: tasksTab },
          {
            key: "milestones",
            label: "Milestones",
            count: milestones.length,
            content: milestonesTab,
          },
          {
            key: "dpr",
            label: "Daily Progress (DPR)",
            count: dprs.length,
            content: dprTab,
          },
        ]}
      />
    </div>
  );
}
