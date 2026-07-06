import { ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { txWhere } from "@/lib/scope";
import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Table, THead, TR, TH, TD } from "@/components/ui/table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Reveal } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function QhsePage() {
  const user = (await getCurrentUser())!;

  const [inspections, ncrs, incidents, passCount, openNcrs] = await Promise.all([
    db.inspection.findMany({
      where: txWhere(user),
      include: { project: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.ncr.findMany({
      where: txWhere(user),
      include: { project: true },
      orderBy: { createdAt: "desc" },
    }),
    db.safetyIncident.findMany({
      where: txWhere(user),
      include: { project: true },
      orderBy: { createdAt: "desc" },
    }),
    db.inspection.count({ where: { ...txWhere(user), result: "Pass" } }),
    db.ncr.count({ where: { ...txWhere(user), status: { not: "Closed" } } }),
  ]);

  const inspectionTotal = await db.inspection.count({ where: txWhere(user) });
  const passRate = inspectionTotal > 0 ? (passCount / inspectionTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quality, Health, Safety & Environment"
        subtitle="Inspections, non-conformance reports and site safety incidents"
        icon={<ShieldCheck className="h-5 w-5" />}
      />

      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Inspections" value={inspectionTotal} format="number" tone="brand" />
        <StatCard label="Pass Rate %" value={passRate} format="number" tone="success" sub={`${passCount} passed of ${inspectionTotal}`} />
        <StatCard label="Open NCRs" value={openNcrs} format="number" tone="danger" />
        <StatCard label="Safety Incidents" value={incidents.length} format="number" tone="info" />
      </Reveal>

      <Tabs
        items={[
          {
            key: "inspections",
            label: "Inspections",
            count: inspections.length,
            content: (
              <Card>
                <CardBody>
                  {inspections.length === 0 ? (
                    <EmptyState icon={<ShieldCheck className="h-5 w-5" />} title="No inspections yet" />
                  ) : (
                    <Table>
                      <THead>
                        <TR>
                          <TH>Date</TH>
                          <TH>Type</TH>
                          <TH>Title</TH>
                          <TH>Project</TH>
                          <TH>Result</TH>
                          <TH align="center">Source</TH>
                        </TR>
                      </THead>
                      <tbody>
                        {inspections.map((i) => (
                          <TR key={i.id}>
                            <TD>{formatDate(i.createdAt)}</TD>
                            <TD>{i.type}</TD>
                            <TD className="font-medium text-fg">{i.title}</TD>
                            <TD>{i.project.name}</TD>
                            <TD>
                              <StatusBadge status={i.result} />
                            </TD>
                            <TD align="center">
                              <Badge tone={i.source === "MOBILE" ? "info" : "neutral"}>
                                {i.source}
                              </Badge>
                            </TD>
                          </TR>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            ),
          },
          {
            key: "ncrs",
            label: "NCRs",
            count: ncrs.length,
            content: (
              <Card>
                <CardBody>
                  {ncrs.length === 0 ? (
                    <EmptyState icon={<ShieldCheck className="h-5 w-5" />} title="No NCRs raised" />
                  ) : (
                    <Table>
                      <THead>
                        <TR>
                          <TH>NCR No</TH>
                          <TH>Title</TH>
                          <TH>Project</TH>
                          <TH align="right">Rework Cost</TH>
                          <TH>Status</TH>
                          <TH>Raised</TH>
                        </TR>
                      </THead>
                      <tbody>
                        {ncrs.map((n) => (
                          <TR key={n.id}>
                            <TD className="font-medium text-fg">{n.number}</TD>
                            <TD>{n.title}</TD>
                            <TD>{n.project.name}</TD>
                            <TD align="right">{formatINR(n.reworkCost)}</TD>
                            <TD>
                              <StatusBadge status={n.status} />
                            </TD>
                            <TD>{formatDate(n.createdAt)}</TD>
                          </TR>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            ),
          },
          {
            key: "incidents",
            label: "Safety Incidents",
            count: incidents.length,
            content: (
              <Card>
                <CardBody>
                  {incidents.length === 0 ? (
                    <EmptyState icon={<ShieldCheck className="h-5 w-5" />} title="No incidents reported" />
                  ) : (
                    <Table>
                      <THead>
                        <TR>
                          <TH>Date</TH>
                          <TH>Type</TH>
                          <TH>Title</TH>
                          <TH>Project</TH>
                          <TH>Severity</TH>
                          <TH>Status</TH>
                        </TR>
                      </THead>
                      <tbody>
                        {incidents.map((s) => (
                          <TR key={s.id}>
                            <TD>{formatDate(s.createdAt)}</TD>
                            <TD>
                              <Badge tone="neutral">{s.type}</Badge>
                            </TD>
                            <TD className="font-medium text-fg">{s.title}</TD>
                            <TD>{s.project.name}</TD>
                            <TD>{s.severity}</TD>
                            <TD>
                              <StatusBadge status={s.status} />
                            </TD>
                          </TR>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
