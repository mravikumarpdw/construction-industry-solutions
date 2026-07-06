import { Landmark, FileText, BadgeCheck, Wallet, AlertTriangle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { txWhere } from "@/lib/scope";
import { formatINR } from "@/lib/money";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress";
import { Reveal } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function ClientBillingPage() {
  const user = (await getCurrentUser())!;

  const bills = await db.clientRaBill.findMany({
    where: txWhere(user),
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });

  // KPIs
  const totalClaimed = bills.reduce((s, b) => s + b.grossThisBill, 0);
  const totalCertified = bills.reduce((s, b) => s + b.certifiedAmount, 0);
  const totalReceived = bills.reduce((s, b) => s + b.receivedAmount, 0);
  const totalOutstanding = totalCertified - totalReceived;

  // Receivables by project
  const byProject = new Map<
    string,
    { name: string; certified: number; received: number }
  >();
  for (const b of bills) {
    const key = b.projectId;
    const cur = byProject.get(key) ?? { name: b.project.name, certified: 0, received: 0 };
    cur.certified += b.certifiedAmount;
    cur.received += b.receivedAmount;
    byProject.set(key, cur);
  }
  const projectRows = Array.from(byProject.values()).sort(
    (a, b) => b.certified - a.certified
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Billing & Receivables"
        subtitle="Revenue side — client RA bills, certification and collections"
        icon={<Landmark className="h-5 w-5" />}
      />

      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Claimed" value={totalClaimed} format="inrCompact" icon={<FileText className="h-5 w-5" />} tone="brand" />
        <StatCard label="Certified" value={totalCertified} format="inrCompact" icon={<BadgeCheck className="h-5 w-5" />} tone="info" />
        <StatCard label="Received" value={totalReceived} format="inrCompact" icon={<Wallet className="h-5 w-5" />} tone="success" />
        <StatCard label="Outstanding" value={totalOutstanding} format="inrCompact" icon={<AlertTriangle className="h-5 w-5" />} tone="danger" sub="Certified not yet received" />
      </Reveal>

      <Card>
        <CardHeader>
          <CardTitle>Client RA Bills</CardTitle>
        </CardHeader>
        <CardBody>
          {bills.length === 0 ? (
            <EmptyState icon={<FileText className="h-6 w-6" />} title="No client bills yet" description="Client RA bills raised against project progress will appear here." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Bill No</TH>
                  <TH>Project</TH>
                  <TH align="right">Gross</TH>
                  <TH align="right">Retention</TH>
                  <TH align="right">GST</TH>
                  <TH align="right">Net Claim</TH>
                  <TH align="right">Certified</TH>
                  <TH align="right">Received</TH>
                  <TH align="right">Outstanding</TH>
                  <TH align="center">Status</TH>
                </TR>
              </THead>
              <tbody>
                {bills.map((b) => {
                  const outstanding = b.certifiedAmount - b.receivedAmount;
                  return (
                    <TR key={b.id}>
                      <TD className="font-medium text-fg">{b.number}</TD>
                      <TD>{b.project.name}</TD>
                      <TD align="right">{formatINR(b.grossThisBill)}</TD>
                      <TD align="right">{formatINR(b.retention)}</TD>
                      <TD align="right">{formatINR(b.gstAmount)}</TD>
                      <TD align="right">{formatINR(b.netClaim)}</TD>
                      <TD align="right">{formatINR(b.certifiedAmount)}</TD>
                      <TD align="right">{formatINR(b.receivedAmount)}</TD>
                      <TD align="right" className="font-semibold text-fg">{formatINR(outstanding)}</TD>
                      <TD align="center"><StatusBadge status={b.status} /></TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receivables by Project</CardTitle>
        </CardHeader>
        <CardBody>
          {projectRows.length === 0 ? (
            <EmptyState icon={<Wallet className="h-6 w-6" />} title="No receivables yet" description="Project-wise certified and collected amounts will appear here." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Project</TH>
                  <TH align="right">Certified</TH>
                  <TH align="right">Received</TH>
                  <TH align="right">Outstanding</TH>
                  <TH>Collection</TH>
                </TR>
              </THead>
              <tbody>
                {projectRows.map((p) => {
                  const outstanding = p.certified - p.received;
                  const collectionPct = p.certified > 0 ? (p.received / p.certified) * 100 : 0;
                  return (
                    <TR key={p.name}>
                      <TD className="font-medium text-fg">{p.name}</TD>
                      <TD align="right">{formatINR(p.certified)}</TD>
                      <TD align="right">{formatINR(p.received)}</TD>
                      <TD align="right" className="font-semibold text-fg">{formatINR(outstanding)}</TD>
                      <TD>
                        <div className="w-40">
                          <ProgressBar value={collectionPct} showLabel tone="success" />
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
