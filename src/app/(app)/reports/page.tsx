import {
  BarChart3,
  AlertTriangle,
  FileText,
  Wallet,
  Package,
  HardHat,
  Users,
  ShoppingCart,
  TrendingUp,
  IndianRupee,
  ClipboardList,
  Receipt,
  FileSpreadsheet,
  FileDown,
  ShieldAlert,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { scopedProjectIds } from "@/lib/scope";
import { portfolioSummary } from "@/lib/cost-ledger";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

const REPORT_PACK = [
  {
    icon: FileText,
    title: "Daily Progress Report (DPR)",
    desc: "Site-wise progress, manpower, machinery, weather & hindrances.",
  },
  {
    icon: Wallet,
    title: "Budget vs Actual",
    desc: "Cost-head variance from the single project ledger.",
  },
  {
    icon: Package,
    title: "Stock & Consumption Variance",
    desc: "Norm vs actual consumption with weighted-average valuation.",
  },
  {
    icon: HardHat,
    title: "Contractor Ledger",
    desc: "WO value, RA bills, retention held & advance recovery.",
  },
  {
    icon: Users,
    title: "Wage Sheets",
    desc: "Muster-to-payroll with OT, deductions & net payable.",
  },
  {
    icon: ShoppingCart,
    title: "PO / GRN Register",
    desc: "Ordered vs received quantities and pending deliveries.",
  },
  {
    icon: IndianRupee,
    title: "Cashflow",
    desc: "Client receipts vs vendor, labour & contractor outflows.",
  },
  {
    icon: TrendingUp,
    title: "Earned Value (EVM)",
    desc: "PV, EV, AC with SPI / CPI performance indices.",
  },
];

export default async function ReportsPage() {
  const user = (await getCurrentUser())!;
  const projectIds = await scopedProjectIds(user);

  const [alerts, portfolio, openIndents, openNcrs, pendingRA] = await Promise.all([
    db.alert.findMany({
      where: { tenantId: user.tenantId },
      orderBy: [{ isResolved: "asc" }, { createdAt: "desc" }],
    }),
    portfolioSummary(user.tenantId, projectIds),
    db.indent.count({
      where: { projectId: { in: projectIds }, status: { in: ["Raised", "Approved"] } },
    }),
    db.ncr.count({
      where: { projectId: { in: projectIds }, status: { notIn: ["Closed", "Verified"] } },
    }),
    db.raBill.count({
      where: { projectId: { in: projectIds }, status: "Submitted" },
    }),
  ]);

  const openAlerts = alerts.filter((a) => !a.isResolved).length;

  const sevDot = (s: string) =>
    s === "high" || s === "critical"
      ? "bg-danger"
      : s === "medium"
      ? "bg-warning"
      : "bg-info";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports, Dashboards & Alerts"
        subtitle="Exception engine and the standard report pack the platform produces"
        icon={<BarChart3 className="h-5 w-5" />}
      />

      {/* MIS Snapshot */}
      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Budget"
          value={portfolio.budget}
          format="inrCompact"
          icon={<Wallet className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Actual Cost"
          value={portfolio.actual}
          format="inrCompact"
          icon={<IndianRupee className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="Committed"
          value={portfolio.committed}
          format="inrCompact"
          icon={<ClipboardList className="h-5 w-5" />}
          tone="neutral"
        />
        <StatCard
          label="Open Indents"
          value={openIndents}
          format="number"
          icon={<ShoppingCart className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Open NCRs"
          value={openNcrs}
          format="number"
          icon={<ShieldAlert className="h-5 w-5" />}
          tone={openNcrs > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Pending RA Bills"
          value={pendingRA}
          format="number"
          icon={<Receipt className="h-5 w-5" />}
          tone="info"
        />
      </Reveal>

      {/* Exception Alerts */}
      <div id="alerts" className="scroll-mt-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Exception Alerts
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge tone="danger">{openAlerts} open</Badge>
              <Badge tone="neutral">{alerts.length} total</Badge>
            </div>
          </CardHeader>
          <CardBody className="space-y-2.5">
            {alerts.length === 0 ? (
              <EmptyState
                icon={<AlertTriangle className="h-5 w-5" />}
                title="All clear"
                description="No exception alerts have been raised across your projects."
              />
            ) : (
              alerts.map((a) => (
                <div
                  key={a.id}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                    a.isResolved
                      ? "border-border bg-surface-2/30 opacity-70"
                      : "border-border bg-surface-2/40 hover:border-brand-300"
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${sevDot(a.severity)}`}
                    title={a.severity}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-fg">{a.title}</p>
                      <Badge tone="neutral">{a.type.replace(/_/g, " ")}</Badge>
                      <Badge
                        tone={
                          a.severity === "high" || a.severity === "critical"
                            ? "danger"
                            : a.severity === "medium"
                            ? "warning"
                            : "info"
                        }
                      >
                        {a.severity}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">{a.message}</p>
                    <p className="mt-1 text-[11px] text-muted">
                      {formatDateTime(a.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={a.isResolved ? "Resolved" : "Open"} />
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      {/* Standard Report Pack */}
      <Card>
        <CardHeader>
          <CardTitle>Standard Report Pack</CardTitle>
          <span className="text-xs text-muted">Auto-generated from live data</span>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {REPORT_PACK.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.title}
                  className="flex flex-col rounded-2xl border border-border bg-surface-2/30 p-4 transition-colors hover:border-brand-300"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-fg">{r.title}</p>
                  <p className="mt-1 flex-1 text-xs text-muted">{r.desc}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-xs font-medium text-fg-soft">
                      <FileDown className="h-3.5 w-3.5" /> PDF
                    </span>
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-xs font-medium text-fg-soft">
                      <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
