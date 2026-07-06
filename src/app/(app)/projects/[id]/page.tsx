import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  IndianRupee,
  Wallet,
  ClipboardList,
  Scale,
  Activity,
  ArrowLeft,
  MapPin,
  ListChecks,
  CalendarClock,
  Flag,
  ReceiptText,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { costByHead } from "@/lib/cost-ledger";
import { formatINR } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TR, TH, TD } from "@/components/ui/table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress";
import { Reveal } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { CostByHeadChart } from "@/components/charts/cost-bar";

export const dynamic = "force-dynamic";

const ledgerTone = {
  Budget: "neutral",
  Committed: "info",
  Actual: "success",
} as const;

export default async function ProjectDetail({
  params,
}: {
  params: { id: string };
}) {
  const user = (await getCurrentUser())!;

  const project = await db.project.findFirst({
    where: { id: params.id, tenantId: user.tenantId },
    include: { client: true },
  });
  if (!project) notFound();
  if (
    !user.scopeAll &&
    user.projectIds.length > 0 &&
    !user.projectIds.includes(project.id)
  ) {
    notFound();
  }

  const [
    budgetAgg,
    ledgerAgg,
    heads,
    boqItems,
    tasks,
    milestones,
    ledger,
  ] = await Promise.all([
    db.budgetLine.aggregate({
      where: { projectId: project.id, approved: true },
      _sum: { amount: true },
    }),
    db.costLedgerEntry.groupBy({
      by: ["type"],
      where: { projectId: project.id },
      _sum: { amount: true },
    }),
    costByHead(project.id),
    db.boqItem.findMany({
      where: { projectId: project.id },
      include: { costHead: true },
      orderBy: { sort: "asc" },
    }),
    db.task.findMany({
      where: { projectId: project.id },
      orderBy: { sort: "asc" },
    }),
    db.milestone.findMany({
      where: { projectId: project.id },
      orderBy: { targetDate: "asc" },
    }),
    db.costLedgerEntry.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const budget = budgetAgg._sum.amount ?? 0;
  const committed =
    ledgerAgg.find((l) => l.type === "Committed")?._sum.amount ?? 0;
  const actual = ledgerAgg.find((l) => l.type === "Actual")?._sum.amount ?? 0;
  const variance = budget - (committed + actual);
  const physicalProgress =
    tasks.length > 0
      ? tasks.reduce((s, t) => s + t.progress, 0) / tasks.length
      : 0;

  const chartData = heads.map((h) => ({
    name: h.name,
    budget: h.budget,
    committed: h.committed,
    actual: h.actual,
  }));

  const boqCard = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-brand-500" /> BOQ &amp; Budget
        </CardTitle>
        <span className="text-xs text-muted">{boqItems.length} items</span>
      </CardHeader>
      <CardBody className="p-0">
        {boqItems.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No BOQ items" />
          </div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Code</TH>
                <TH>Description</TH>
                <TH>Head</TH>
                <TH>Unit</TH>
                <TH align="right">Quantity</TH>
                <TH align="right">Rate</TH>
                <TH align="right">Amount</TH>
              </TR>
            </THead>
            <tbody>
              {boqItems.map((b) => (
                <TR key={b.id}>
                  <TD className="font-medium text-fg">{b.code}</TD>
                  <TD>{b.description}</TD>
                  <TD>
                    {b.costHead ? (
                      <Badge tone="neutral">{b.costHead.name}</Badge>
                    ) : (
                      "—"
                    )}
                  </TD>
                  <TD>{b.unit}</TD>
                  <TD align="right">{b.quantity}</TD>
                  <TD align="right">{formatINR(b.rate)}</TD>
                  <TD align="right">{formatINR(b.amount)}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );

  const scheduleCard = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-brand-500" /> Schedule / WBS
        </CardTitle>
        <span className="text-xs text-muted">{tasks.length} tasks</span>
      </CardHeader>
      <CardBody className="p-0">
        {tasks.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No tasks scheduled" />
          </div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>WBS</TH>
                <TH>Task</TH>
                <TH>Status</TH>
                <TH className="w-40">Progress</TH>
                <TH align="right">Planned End</TH>
              </TR>
            </THead>
            <tbody>
              {tasks.map((t) => (
                <TR key={t.id}>
                  <TD className="font-medium text-fg">{t.wbsCode ?? "—"}</TD>
                  <TD>{t.name}</TD>
                  <TD>
                    <StatusBadge status={t.status} />
                  </TD>
                  <TD>
                    <ProgressBar value={t.progress} showLabel />
                  </TD>
                  <TD align="right">{formatDate(t.plannedEnd)}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );

  const milestonesCard = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-brand-500" /> Milestones
        </CardTitle>
        <span className="text-xs text-muted">{milestones.length} total</span>
      </CardHeader>
      <CardBody>
        {milestones.length === 0 ? (
          <EmptyState title="No milestones defined" />
        ) : (
          <div className="space-y-2">
            {milestones.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/40 p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-fg">
                      {m.name}
                    </p>
                    {m.billingStage && <Badge tone="purple">Billing</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    Target {formatDate(m.targetDate)}
                    {m.actualDate
                      ? ` · Achieved ${formatDate(m.actualDate)}`
                      : ""}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );

  const ledgerCard = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-brand-500" /> Recent Cost Ledger
        </CardTitle>
        <span className="text-xs text-muted">latest {ledger.length}</span>
      </CardHeader>
      <CardBody className="p-0">
        {ledger.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No ledger entries yet" />
          </div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Type</TH>
                <TH>Source</TH>
                <TH>Description</TH>
                <TH align="right">Amount</TH>
                <TH align="right">Posted</TH>
              </TR>
            </THead>
            <tbody>
              {ledger.map((e) => (
                <TR key={e.id}>
                  <TD>
                    <Badge tone={ledgerTone[e.type as keyof typeof ledgerTone] ?? "neutral"}>
                      {e.type}
                    </Badge>
                  </TD>
                  <TD>{e.sourceType}</TD>
                  <TD>{e.description ?? "—"}</TD>
                  <TD align="right">{formatINR(e.amount)}</TD>
                  <TD align="right">{formatDateTime(e.createdAt)}</TD>
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
      <div className="flex flex-col gap-2">
        <Link
          href="/projects"
          className="flex w-fit items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All projects
        </Link>
        <PageHeader
          title={project.name}
          subtitle={`${project.code} · ${project.location ?? "—"}`}
          icon={<Building2 className="h-5 w-5" />}
          actions={<StatusBadge status={project.status} />}
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          {project.client?.name && (
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> {project.client.name}
            </span>
          )}
          <span className="flex items-center gap-1.5 capitalize">
            <MapPin className="h-3.5 w-3.5" /> {project.type}
          </span>
          <span>Start {formatDate(project.startDate)}</span>
          <span>End {formatDate(project.endDate)}</span>
        </div>
      </div>

      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Contract Value"
          value={project.contractValue}
          format="inrCompact"
          icon={<IndianRupee className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Budget"
          value={budget}
          format="inrCompact"
          icon={<ClipboardList className="h-5 w-5" />}
          tone="neutral"
        />
        <StatCard
          label="Committed"
          value={committed}
          format="inrCompact"
          icon={<ClipboardList className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="Actual"
          value={actual}
          format="inrCompact"
          icon={<Wallet className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="Variance"
          value={variance}
          format="inrCompact"
          icon={<Scale className="h-5 w-5" />}
          tone={variance >= 0 ? "success" : "danger"}
          sub={variance >= 0 ? "under budget" : "over budget"}
        />
        <StatCard
          label="Physical Progress"
          value={Math.round(physicalProgress)}
          format="number"
          icon={<Activity className="h-5 w-5" />}
          tone="success"
          sub={`${tasks.length} tasks`}
        />
      </Reveal>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Cost Control — Budget vs Committed vs Actual</CardTitle>
            <p className="mt-0.5 text-xs text-muted">By cost head</p>
          </div>
        </CardHeader>
        <CardBody>
          {chartData.length === 0 ? (
            <EmptyState title="No cost data yet" />
          ) : (
            <CostByHeadChart data={chartData} />
          )}
        </CardBody>
      </Card>

      <Tabs
        items={[
          { key: "boq", label: "BOQ & Budget", count: boqItems.length, content: boqCard },
          { key: "schedule", label: "Schedule", count: tasks.length, content: scheduleCard },
          { key: "milestones", label: "Milestones", count: milestones.length, content: milestonesCard },
          { key: "ledger", label: "Cost Ledger", count: ledger.length, content: ledgerCard },
        ]}
      />
    </div>
  );
}
