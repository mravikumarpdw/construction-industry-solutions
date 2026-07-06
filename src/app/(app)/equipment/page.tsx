import { Truck } from "lucide-react";
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

const DAY = 24 * 60 * 60 * 1000;

export default async function EquipmentPage() {
  const user = (await getCurrentUser())!;

  const [fleet, logs, deployed, maintenance, costAgg] = await Promise.all([
    db.equipment.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { code: "asc" },
    }),
    db.equipmentLog.findMany({
      where: txWhere(user),
      include: { equipment: true, project: true },
      orderBy: { date: "desc" },
      take: 60,
    }),
    db.equipment.count({ where: { tenantId: user.tenantId, status: "Deployed" } }),
    db.equipment.count({
      where: { tenantId: user.tenantId, status: { in: ["Maintenance", "Breakdown"] } },
    }),
    db.equipmentLog.aggregate({ where: txWhere(user), _sum: { cost: true } }),
  ]);

  const totalCost = costAgg._sum.cost ?? 0;
  const now = Date.now();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plant & Equipment"
        subtitle="Fleet register, deployment status and daily machine log sheets"
        icon={<Truck className="h-5 w-5" />}
      />

      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Assets" value={fleet.length} format="number" tone="brand" />
        <StatCard label="Deployed" value={deployed} format="number" tone="success" />
        <StatCard label="Under Maintenance" value={maintenance} format="number" tone="danger" />
        <StatCard label="Equipment Cost This Cycle" value={totalCost} format="inrCompact" tone="info" />
      </Reveal>

      <Tabs
        items={[
          {
            key: "fleet",
            label: "Fleet",
            count: fleet.length,
            content: (
              <Card>
                <CardBody>
                  {fleet.length === 0 ? (
                    <EmptyState icon={<Truck className="h-5 w-5" />} title="No equipment registered" />
                  ) : (
                    <Table>
                      <THead>
                        <TR>
                          <TH>Code</TH>
                          <TH>Name</TH>
                          <TH>Category</TH>
                          <TH>Ownership</TH>
                          <TH align="right">Hire Rate</TH>
                          <TH>Status</TH>
                          <TH>Doc Expiry</TH>
                        </TR>
                      </THead>
                      <tbody>
                        {fleet.map((e) => {
                          const soon =
                            e.docExpiry != null &&
                            e.docExpiry.getTime() - now < 30 * DAY;
                          return (
                            <TR key={e.id}>
                              <TD className="font-medium text-fg">{e.code}</TD>
                              <TD>{e.name}</TD>
                              <TD>{e.category ?? "—"}</TD>
                              <TD>
                                <Badge tone={e.ownership === "owned" ? "brand" : "purple"}>
                                  {e.ownership}
                                </Badge>
                              </TD>
                              <TD align="right">{formatINR(e.hireRate)}/hr</TD>
                              <TD>
                                <StatusBadge status={e.status} />
                              </TD>
                              <TD>
                                {e.docExpiry ? (
                                  soon ? (
                                    <Badge tone="warning">{formatDate(e.docExpiry)}</Badge>
                                  ) : (
                                    formatDate(e.docExpiry)
                                  )
                                ) : (
                                  "—"
                                )}
                              </TD>
                            </TR>
                          );
                        })}
                      </tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            ),
          },
          {
            key: "logs",
            label: "Log Sheets",
            count: logs.length,
            content: (
              <Card>
                <CardBody>
                  {logs.length === 0 ? (
                    <EmptyState icon={<Truck className="h-5 w-5" />} title="No log sheets yet" />
                  ) : (
                    <Table>
                      <THead>
                        <TR>
                          <TH>Date</TH>
                          <TH>Equipment</TH>
                          <TH>Project</TH>
                          <TH align="right">Running Hrs</TH>
                          <TH align="right">Idle Hrs</TH>
                          <TH align="right">Fuel (L)</TH>
                          <TH>Operator</TH>
                          <TH align="right">Cost</TH>
                          <TH align="center">Source</TH>
                        </TR>
                      </THead>
                      <tbody>
                        {logs.map((l) => (
                          <TR key={l.id}>
                            <TD>{formatDate(l.date)}</TD>
                            <TD className="font-medium text-fg">{l.equipment.name}</TD>
                            <TD>{l.project.name}</TD>
                            <TD align="right">{l.runningHours}</TD>
                            <TD align="right">{l.idleHours}</TD>
                            <TD align="right">{l.fuelIssued}</TD>
                            <TD>{l.operator ?? "—"}</TD>
                            <TD align="right">{formatINR(l.cost)}</TD>
                            <TD align="center">
                              <Badge tone={l.source === "MOBILE" ? "info" : "neutral"}>
                                {l.source}
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
        ]}
      />
    </div>
  );
}
