import { HardHat, FileText, Ruler, Users, Receipt } from "lucide-react";
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
import { ProgressBar } from "@/components/ui/progress";
import { Reveal } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function ContractorPage() {
  const user = (await getCurrentUser())!;

  const [workOrders, raBills, contractors, mbEntries] = await Promise.all([
    db.workOrder.findMany({
      where: txWhere(user),
      include: { contractor: true, project: true, lines: true },
      orderBy: { createdAt: "desc" },
    }),
    db.raBill.findMany({
      where: txWhere(user),
      include: { wo: { include: { contractor: true } }, project: true },
      orderBy: { createdAt: "desc" },
    }),
    db.contractor.findMany({
      where: { tenantId: user.tenantId },
      include: { workOrders: true },
      orderBy: { name: "asc" },
    }),
    db.mbEntry.findMany({
      where: { tenantId: user.tenantId },
      include: { woLine: { include: { wo: { include: { contractor: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  // KPIs
  const activeWos = workOrders.filter((w) => w.status === "Active").length;
  const totalWoValue = workOrders.reduce((s, w) => s + w.value, 0);
  const netPayableCycle = raBills
    .filter((b) => b.status === "Submitted" || b.status === "Approved")
    .reduce((s, b) => s + b.netPayable, 0);

  const now = Date.now();
  const in30Days = now + 30 * 24 * 60 * 60 * 1000;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contractor Management"
        subtitle="Work Order → Measurement Book → RA Bill, with system-computed bill math"
        icon={<HardHat className="h-5 w-5" />}
      />

      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Work Orders" value={activeWos} format="number" icon={<FileText className="h-5 w-5" />} tone="brand" />
        <StatCard label="Total WO Value" value={totalWoValue} format="inrCompact" icon={<Receipt className="h-5 w-5" />} tone="info" />
        <StatCard label="RA Bills Raised" value={raBills.length} format="number" icon={<Ruler className="h-5 w-5" />} tone="neutral" />
        <StatCard label="Net Payable · This Cycle" value={netPayableCycle} format="inrCompact" icon={<Users className="h-5 w-5" />} tone="success" sub="Submitted + Approved RA bills" />
      </Reveal>

      <Tabs
        items={[
          {
            key: "work-orders",
            label: "Work Orders",
            count: workOrders.length,
            content: (
              <Card>
                <CardBody>
                  {workOrders.length === 0 ? (
                    <EmptyState icon={<FileText className="h-6 w-6" />} title="No work orders yet" description="Work orders issued to contractors will appear here." />
                  ) : (
                    <Table>
                      <THead>
                        <TR>
                          <TH>WO No</TH>
                          <TH>Contractor</TH>
                          <TH>Project</TH>
                          <TH>Type</TH>
                          <TH align="right">Value</TH>
                          <TH align="right">Retention</TH>
                          <TH align="center">Status</TH>
                        </TR>
                      </THead>
                      <tbody>
                        {workOrders.map((w) => {
                          const woQty = w.lines.reduce((s, l) => s + l.quantity, 0);
                          const measured = w.lines.reduce((s, l) => s + l.measuredQty, 0);
                          const progress = woQty > 0 ? (measured / woQty) * 100 : 0;
                          return (
                            <TR key={w.id}>
                              <TD className="font-medium text-fg">{w.number}</TD>
                              <TD>
                                <div className="font-medium text-fg">{w.contractor.name}</div>
                                {w.contractor.trade && <div className="text-xs text-muted">{w.contractor.trade}</div>}
                              </TD>
                              <TD>{w.project.name}</TD>
                              <TD><Badge tone="neutral">{w.type}</Badge></TD>
                              <TD align="right">
                                <div className="font-medium text-fg">{formatINR(w.value)}</div>
                                <div className="mt-1 w-32 ml-auto">
                                  <ProgressBar value={progress} showLabel tone="brand" />
                                </div>
                              </TD>
                              <TD align="right">{w.retentionPct}%</TD>
                              <TD align="center"><StatusBadge status={w.status} /></TD>
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
            key: "ra-bills",
            label: "RA Bills",
            count: raBills.length,
            content: (
              <Card>
                <CardBody>
                  {raBills.length === 0 ? (
                    <EmptyState icon={<Ruler className="h-6 w-6" />} title="No RA bills yet" description="Running Account bills raised against work orders will appear here." />
                  ) : (
                    <Table>
                      <THead>
                        <TR>
                          <TH>RA No</TH>
                          <TH>Contractor</TH>
                          <TH align="right">Gross</TH>
                          <TH align="right">Retention</TH>
                          <TH align="right">Adv Recovery</TH>
                          <TH align="right">Material Rec</TH>
                          <TH align="right">GST</TH>
                          <TH align="right">TDS</TH>
                          <TH align="right">Net Payable</TH>
                          <TH align="center">Status</TH>
                        </TR>
                      </THead>
                      <tbody>
                        {raBills.map((b) => (
                          <TR key={b.id}>
                            <TD className="font-medium text-fg">{b.number}</TD>
                            <TD>{b.wo.contractor.name}</TD>
                            <TD align="right">{formatINR(b.grossThisBill)}</TD>
                            <TD align="right">{formatINR(b.retention)}</TD>
                            <TD align="right">{formatINR(b.advanceRecovery)}</TD>
                            <TD align="right">{formatINR(b.materialRecovery)}</TD>
                            <TD align="right">{formatINR(b.gstAmount)}</TD>
                            <TD align="right">{formatINR(b.tdsAmount)}</TD>
                            <TD align="right" className="font-semibold text-fg">{formatINR(b.netPayable)}</TD>
                            <TD align="center"><StatusBadge status={b.status} /></TD>
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
            key: "contractors",
            label: "Contractors",
            count: contractors.length,
            content: (
              <Card>
                <CardBody>
                  {contractors.length === 0 ? (
                    <EmptyState icon={<Users className="h-6 w-6" />} title="No contractors yet" description="Registered contractors will appear here." />
                  ) : (
                    <Table>
                      <THead>
                        <TR>
                          <TH>Name</TH>
                          <TH>Trade</TH>
                          <TH>GSTIN</TH>
                          <TH align="center">Rating</TH>
                          <TH align="right">Active WOs</TH>
                          <TH align="center">Doc Expiry</TH>
                        </TR>
                      </THead>
                      <tbody>
                        {contractors.map((c) => {
                          const activeCount = c.workOrders.filter((w) => w.status === "Active").length;
                          const expTs = c.docExpiry ? new Date(c.docExpiry).getTime() : null;
                          const expiringSoon = expTs != null && expTs <= in30Days;
                          const expired = expTs != null && expTs < now;
                          return (
                            <TR key={c.id}>
                              <TD className="font-medium text-fg">{c.name}</TD>
                              <TD>{c.trade ?? "—"}</TD>
                              <TD className="text-xs">{c.gstin ?? "—"}</TD>
                              <TD align="center">{c.rating > 0 ? `⭐ ${c.rating.toFixed(1)}` : "—"}</TD>
                              <TD align="right">{activeCount}</TD>
                              <TD align="center">
                                {c.docExpiry ? (
                                  expiringSoon ? (
                                    <Badge tone={expired ? "danger" : "warning"}>{formatDate(c.docExpiry)}</Badge>
                                  ) : (
                                    formatDate(c.docExpiry)
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
            key: "mb",
            label: "Measurement Books",
            count: mbEntries.length,
            content: (
              <Card>
                <CardBody>
                  {mbEntries.length === 0 ? (
                    <EmptyState icon={<Ruler className="h-6 w-6" />} title="No measurements recorded" description="Digital measurement book entries from site will appear here." />
                  ) : (
                    <Table>
                      <THead>
                        <TR>
                          <TH>Date</TH>
                          <TH>WO</TH>
                          <TH>Contractor</TH>
                          <TH>Description</TH>
                          <TH align="center">L×B×H</TH>
                          <TH align="right">Qty</TH>
                          <TH align="center">Source</TH>
                          <TH align="center">Status</TH>
                        </TR>
                      </THead>
                      <tbody>
                        {mbEntries.map((m) => (
                          <TR key={m.id}>
                            <TD>{formatDate(m.date)}</TD>
                            <TD className="font-medium text-fg">{m.woLine.wo.number}</TD>
                            <TD>{m.woLine.wo.contractor.name}</TD>
                            <TD>{m.woLine.description}</TD>
                            <TD align="center" className="tabular text-xs">{`${m.length}×${m.breadth}×${m.height}`}</TD>
                            <TD align="right">{m.quantity}</TD>
                            <TD align="center"><Badge tone={m.source === "MOBILE" ? "info" : "neutral"}>{m.source}</Badge></TD>
                            <TD align="center"><StatusBadge status={m.status} /></TD>
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
