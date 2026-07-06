import {
  ShoppingCart,
  ClipboardList,
  FileText,
  PackageCheck,
  Store,
  Truck,
  AlertTriangle,
  Star,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { txWhere } from "@/lib/scope";
import { formatINR, formatNumber } from "@/lib/money";
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

export default async function ProcurementPage() {
  const user = (await getCurrentUser())!;

  const [indents, pos, grns, vendors] = await Promise.all([
    db.indent.findMany({
      where: txWhere(user),
      include: { lines: { include: { item: true } }, project: true },
      orderBy: { createdAt: "desc" },
    }),
    db.purchaseOrder.findMany({
      where: txWhere(user),
      include: { vendor: true, project: true, lines: true },
      orderBy: { createdAt: "desc" },
    }),
    db.grn.findMany({
      where: txWhere(user),
      include: { po: true, project: true, lines: true },
      orderBy: { createdAt: "desc" },
    }),
    db.vendor.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { name: "asc" },
    }),
  ]);

  // KPIs
  const openIndents = indents.filter((i) =>
    ["Raised", "Approved"].includes(i.status)
  ).length;
  const openPoValue = pos
    .filter((p) => !["Received", "Closed"].includes(p.status))
    .reduce((s, p) => s + p.total, 0);
  const grnCount = grns.length;

  const now = Date.now();
  const in30Days = 30 * 24 * 60 * 60 * 1000;

  const indentsTab =
    indents.length === 0 ? (
      <EmptyState
        icon={<ClipboardList className="h-5 w-5" />}
        title="No indents yet"
        description="Material requisitions raised from site will appear here."
      />
    ) : (
      <Table>
        <THead>
          <TR>
            <TH>Number</TH>
            <TH>Project</TH>
            <TH>Items</TH>
            <TH>Required By</TH>
            <TH>Raised By</TH>
            <TH>Source</TH>
            <TH>Status</TH>
          </TR>
        </THead>
        <tbody>
          {indents.map((i) => {
            const first = i.lines[0]?.item.name;
            const itemLabel =
              i.lines.length === 0
                ? "—"
                : i.lines.length === 1
                ? first
                : `${first} +${i.lines.length - 1}`;
            return (
              <TR key={i.id}>
                <TD className="font-medium text-fg">{i.number}</TD>
                <TD>{i.project.name}</TD>
                <TD>{itemLabel}</TD>
                <TD>{formatDate(i.requiredBy)}</TD>
                <TD>{i.raisedByName ?? "—"}</TD>
                <TD>
                  <Badge tone={i.source === "MOBILE" ? "info" : "neutral"}>
                    {i.source}
                  </Badge>
                </TD>
                <TD>
                  <StatusBadge status={i.status} />
                </TD>
              </TR>
            );
          })}
        </tbody>
      </Table>
    );

  const poTab =
    pos.length === 0 ? (
      <EmptyState
        icon={<FileText className="h-5 w-5" />}
        title="No purchase orders"
        description="Approved POs to vendors will be listed here."
      />
    ) : (
      <Table>
        <THead>
          <TR>
            <TH>PO No</TH>
            <TH>Vendor</TH>
            <TH>Project</TH>
            <TH align="right">Lines</TH>
            <TH align="right">SubTotal</TH>
            <TH align="right">Tax</TH>
            <TH align="right">Total</TH>
            <TH>Status</TH>
          </TR>
        </THead>
        <tbody>
          {pos.map((p) => (
            <TR key={p.id}>
              <TD className="font-medium text-fg">{p.number}</TD>
              <TD>{p.vendor.name}</TD>
              <TD>{p.project.name}</TD>
              <TD align="right">{p.lines.length}</TD>
              <TD align="right">{formatINR(p.subTotal)}</TD>
              <TD align="right">{formatINR(p.taxAmount)}</TD>
              <TD align="right">{formatINR(p.total)}</TD>
              <TD>
                <StatusBadge status={p.status} />
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>
    );

  const grnTab =
    grns.length === 0 ? (
      <EmptyState
        icon={<PackageCheck className="h-5 w-5" />}
        title="No GRNs recorded"
        description="Goods receipts against purchase orders will show up here."
      />
    ) : (
      <Table>
        <THead>
          <TR>
            <TH>GRN No</TH>
            <TH>PO No</TH>
            <TH>Project</TH>
            <TH>Vehicle</TH>
            <TH align="right">Received Qty</TH>
            <TH>Source</TH>
            <TH>Status</TH>
          </TR>
        </THead>
        <tbody>
          {grns.map((g) => {
            const receivedQty = g.lines.reduce((s, l) => s + l.acceptedQty, 0);
            return (
              <TR key={g.id}>
                <TD className="font-medium text-fg">{g.number}</TD>
                <TD>{g.po.number}</TD>
                <TD>{g.project.name}</TD>
                <TD>{g.vehicleNo ?? "—"}</TD>
                <TD align="right">{formatNumber(receivedQty)}</TD>
                <TD>
                  <Badge tone={g.source === "MOBILE" ? "info" : "neutral"}>
                    {g.source}
                  </Badge>
                </TD>
                <TD>
                  <StatusBadge status={g.status} />
                </TD>
              </TR>
            );
          })}
        </tbody>
      </Table>
    );

  const vendorsTab =
    vendors.length === 0 ? (
      <EmptyState
        icon={<Store className="h-5 w-5" />}
        title="No vendors"
        description="Registered material suppliers will be listed here."
      />
    ) : (
      <Table>
        <THead>
          <TR>
            <TH>Name</TH>
            <TH>Category</TH>
            <TH>GSTIN</TH>
            <TH align="right">Rating</TH>
            <TH>Doc Expiry</TH>
          </TR>
        </THead>
        <tbody>
          {vendors.map((v) => {
            const expiring =
              v.docExpiry != null &&
              v.docExpiry.getTime() - now <= in30Days;
            return (
              <TR key={v.id}>
                <TD className="font-medium text-fg">{v.name}</TD>
                <TD>{v.category ?? "—"}</TD>
                <TD>{v.gstin ?? "—"}</TD>
                <TD align="right">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    {v.rating.toFixed(1)}
                  </span>
                </TD>
                <TD>
                  {v.docExpiry == null ? (
                    "—"
                  ) : expiring ? (
                    <Badge tone="warning">
                      <AlertTriangle className="h-3 w-3" />
                      {formatDate(v.docExpiry)}
                    </Badge>
                  ) : (
                    formatDate(v.docExpiry)
                  )}
                </TD>
              </TR>
            );
          })}
        </tbody>
      </Table>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement"
        subtitle="Purchase cycle — Indent → RFQ → PO → GRN → Invoice"
        icon={<ShoppingCart className="h-5 w-5" />}
      />

      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Open Indents"
          value={openIndents}
          format="number"
          icon={<ClipboardList className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Open POs Value"
          value={openPoValue}
          format="inrCompact"
          icon={<FileText className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="GRNs this cycle"
          value={grnCount}
          format="number"
          icon={<Truck className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="Vendors"
          value={vendors.length}
          format="number"
          icon={<Store className="h-5 w-5" />}
          tone="neutral"
        />
      </Reveal>

      <Card>
        <CardBody>
          <Tabs
            items={[
              { key: "indents", label: "Indents", count: indents.length, content: indentsTab },
              { key: "pos", label: "Purchase Orders", count: pos.length, content: poTab },
              { key: "grn", label: "GRN", count: grns.length, content: grnTab },
              { key: "vendors", label: "Vendors", count: vendors.length, content: vendorsTab },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  );
}
