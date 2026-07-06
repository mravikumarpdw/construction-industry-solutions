import Link from "next/link";
import {
  Building2,
  IndianRupee,
  Wallet,
  Gauge,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectWhere } from "@/lib/scope";
import { formatINR } from "@/lib/money";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { Reveal, RevealItem } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = (await getCurrentUser())!;

  const projects = await db.project.findMany({
    where: projectWhere(user),
    include: { client: true },
    orderBy: { createdAt: "asc" },
  });

  const summaries = await Promise.all(
    projects.map(async (p) => {
      const [bl, led] = await Promise.all([
        db.budgetLine.aggregate({
          where: { projectId: p.id, approved: true },
          _sum: { amount: true },
        }),
        db.costLedgerEntry.groupBy({
          by: ["type"],
          where: { projectId: p.id },
          _sum: { amount: true },
        }),
      ]);
      const budget = bl._sum.amount ?? 0;
      const committed =
        led.find((l) => l.type === "Committed")?._sum.amount ?? 0;
      const actual = led.find((l) => l.type === "Actual")?._sum.amount ?? 0;
      const util = budget > 0 ? ((committed + actual) / budget) * 100 : 0;
      return { ...p, budget, committed, actual, util };
    })
  );

  const totalContract = projects.reduce((s, p) => s + p.contractValue, 0);
  const totalActual = summaries.reduce((s, p) => s + p.actual, 0);
  const totalBudget = summaries.reduce((s, p) => s + p.budget, 0);
  const totalUsed = summaries.reduce((s, p) => s + p.actual + p.committed, 0);
  const weightedUtil = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle="Portfolio of sites with live cost utilisation"
        icon={<Building2 className="h-5 w-5" />}
      />

      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Projects"
          value={projects.length}
          format="number"
          icon={<Building2 className="h-5 w-5" />}
          tone="brand"
          sub={`${projects.filter((p) => p.status === "Active").length} active`}
        />
        <StatCard
          label="Contract Value"
          value={totalContract}
          format="inrCompact"
          icon={<IndianRupee className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="Actual Cost"
          value={totalActual}
          format="inrCompact"
          icon={<Wallet className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="Avg Utilisation"
          value={Math.round(weightedUtil)}
          format="number"
          icon={<Gauge className="h-5 w-5" />}
          tone={weightedUtil >= 100 ? "danger" : "neutral"}
          sub="weighted by budget"
        />
      </Reveal>

      {projects.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="No projects yet"
          description="Projects assigned to you will appear here."
        />
      ) : (
        <Reveal className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {summaries.map((p) => (
            <RevealItem key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-card transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-glow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-base font-semibold text-fg">
                        {p.name}
                      </p>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{p.code}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <div className="mt-3 space-y-1 text-xs text-muted">
                  {p.client?.name && (
                    <p className="truncate">{p.client.name}</p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{p.location ?? "—"}</span>
                    <span className="text-fg-soft">·</span>
                    <span className="capitalize">{p.type}</span>
                  </p>
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted">Contract Value</p>
                    <p className="text-lg font-semibold text-fg tabular">
                      {formatINR(p.contractValue, { compact: true })}
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <ProgressBar value={p.util} showLabel />
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted">Budget</p>
                      <p className="font-medium text-fg-soft tabular">
                        {formatINR(p.budget, { compact: true })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">Actual</p>
                      <p className="font-medium text-fg-soft tabular">
                        {formatINR(p.actual, { compact: true })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">Committed</p>
                      <p className="font-medium text-fg-soft tabular">
                        {formatINR(p.committed, { compact: true })}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </RevealItem>
          ))}
        </Reveal>
      )}
    </div>
  );
}
