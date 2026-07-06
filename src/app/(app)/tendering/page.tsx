import {
  FileSpreadsheet,
  Target,
  Trophy,
  Percent,
  Gavel,
  Layers,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress";
import { Reveal } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

const STAGES = ["Identified", "Bidding", "Won", "Lost"] as const;

const STAGE_ACCENT: Record<(typeof STAGES)[number], string> = {
  Identified: "text-info",
  Bidding: "text-warning",
  Won: "text-success",
  Lost: "text-danger",
};

export default async function TenderingPage() {
  const user = (await getCurrentUser())!;

  const tenders = await db.tender.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { createdAt: "desc" },
  });

  const pipelineValue = tenders
    .filter((t) => t.status === "Identified" || t.status === "Bidding")
    .reduce((s, t) => s + t.estimatedValue, 0);
  const wonValue = tenders
    .filter((t) => t.status === "Won")
    .reduce((s, t) => s + t.estimatedValue, 0);
  const wonCount = tenders.filter((t) => t.status === "Won").length;
  const lostCount = tenders.filter((t) => t.status === "Lost").length;
  const decided = wonCount + lostCount;
  const winRate = decided > 0 ? (wonCount / decided) * 100 : 0;
  const activeBids = tenders.filter((t) => t.status === "Bidding").length;

  const byStage = STAGES.map((stage) => {
    const rows = tenders.filter((t) => t.status === stage);
    return {
      stage,
      count: rows.length,
      value: rows.reduce((s, t) => s + t.estimatedValue, 0),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tendering & Estimation"
        subtitle="Opportunity pipeline, bid tracking and win-rate analytics"
        icon={<FileSpreadsheet className="h-5 w-5" />}
      />

      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Pipeline Value"
          value={pipelineValue}
          format="inrCompact"
          icon={<Target className="h-5 w-5" />}
          tone="brand"
          sub="Identified + Bidding"
        />
        <StatCard
          label="Won Value"
          value={wonValue}
          format="inrCompact"
          icon={<Trophy className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="Win Rate %"
          value={Math.round(winRate)}
          format="number"
          icon={<Percent className="h-5 w-5" />}
          tone="success"
          sub={`${wonCount} won of ${decided} decided`}
        />
        <StatCard
          label="Active Bids"
          value={activeBids}
          format="number"
          icon={<Gavel className="h-5 w-5" />}
          tone="info"
        />
      </Reveal>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted" /> Pipeline by Stage
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {byStage.map((s) => (
              <div
                key={s.stage}
                className="rounded-xl border border-border bg-surface-2/40 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">
                    {s.stage}
                  </span>
                  <span
                    className={`text-lg font-semibold tabular ${STAGE_ACCENT[s.stage]}`}
                  >
                    {s.count}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-fg tabular">
                  {formatINR(s.value, { compact: true })}
                </p>
                <p className="text-xs text-muted">
                  {s.count === 1 ? "opportunity" : "opportunities"}
                </p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Opportunity Pipeline</CardTitle>
          <span className="text-xs text-muted">{tenders.length} tenders</span>
        </CardHeader>
        <CardBody className="p-0">
          {tenders.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<FileSpreadsheet className="h-5 w-5" />}
                title="No tenders yet"
                description="Track bidding opportunities and estimates from identification to award."
              />
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Opportunity</TH>
                  <TH>Client</TH>
                  <TH align="right">Est. Value</TH>
                  <TH align="right">EMD</TH>
                  <TH>Submission</TH>
                  <TH className="w-48">Probability</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <tbody>
                {tenders.map((t) => (
                  <TR key={t.id}>
                    <TD className="font-medium text-fg">{t.name}</TD>
                    <TD>{t.clientName ?? "—"}</TD>
                    <TD align="right">{formatINR(t.estimatedValue)}</TD>
                    <TD align="right">{formatINR(t.emd)}</TD>
                    <TD className="whitespace-nowrap">
                      {formatDate(t.submissionDate)}
                    </TD>
                    <TD className="w-48">
                      <ProgressBar value={t.probability} showLabel />
                    </TD>
                    <TD>
                      <StatusBadge status={t.status} />
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
