import {
  Package,
  Boxes,
  ClipboardList,
  ArrowDownUp,
  AlertTriangle,
  Warehouse,
  IndianRupee,
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

export default async function MaterialPage() {
  const user = (await getCurrentUser())!;

  const [stockItems, items, issues, indents] = await Promise.all([
    db.stockItem.findMany({
      where: txWhere(user),
      include: { item: true, project: true },
    }),
    db.item.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { code: "asc" },
    }),
    db.materialIssue.findMany({
      where: txWhere(user),
      include: { item: true, project: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.indent.findMany({
      where: txWhere(user),
      include: { lines: { include: { item: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // KPIs
  const stockValue = stockItems.reduce((s, si) => s + si.value, 0);
  const lowStockCount = stockItems.filter(
    (si) => si.quantity < si.item.minStock
  ).length;
  const issuesValue = issues.reduce((s, mi) => s + mi.value, 0);

  const stockTab =
    stockItems.length === 0 ? (
      <EmptyState
        icon={<Warehouse className="h-5 w-5" />}
        title="No stock on site"
        description="Site-wise stock positions will appear here as goods are received."
      />
    ) : (
      <Table>
        <THead>
          <TR>
            <TH>Item</TH>
            <TH>Project</TH>
            <TH align="right">Qty</TH>
            <TH align="right">WAvg Rate</TH>
            <TH align="right">Value</TH>
            <TH>Flag</TH>
          </TR>
        </THead>
        <tbody>
          {stockItems.map((si) => {
            const low = si.quantity < si.item.minStock;
            return (
              <TR key={si.id}>
                <TD className="font-medium text-fg">{si.item.name}</TD>
                <TD>{si.project.name}</TD>
                <TD align="right">
                  {formatNumber(si.quantity)} {si.item.unit}
                </TD>
                <TD align="right">{formatINR(si.wavgRate)}</TD>
                <TD align="right">{formatINR(si.value)}</TD>
                <TD>
                  {low ? (
                    <Badge tone="warning">
                      <AlertTriangle className="h-3 w-3" />
                      Low stock
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TD>
              </TR>
            );
          })}
        </tbody>
      </Table>
    );

  const itemTab =
    items.length === 0 ? (
      <EmptyState
        icon={<Boxes className="h-5 w-5" />}
        title="No items in master"
        description="The item master catalogue will be listed here."
      />
    ) : (
      <Table>
        <THead>
          <TR>
            <TH>Code</TH>
            <TH>Name</TH>
            <TH>Category</TH>
            <TH>Unit</TH>
            <TH>HSN</TH>
            <TH align="right">Min / Max</TH>
          </TR>
        </THead>
        <tbody>
          {items.map((it) => (
            <TR key={it.id}>
              <TD className="font-medium text-fg">{it.code}</TD>
              <TD>{it.name}</TD>
              <TD>{it.category ?? "—"}</TD>
              <TD>{it.unit}</TD>
              <TD>{it.hsn ?? "—"}</TD>
              <TD align="right">
                {formatNumber(it.minStock)} / {formatNumber(it.maxStock)}
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>
    );

  const issuesTab =
    issues.length === 0 ? (
      <EmptyState
        icon={<ArrowDownUp className="h-5 w-5" />}
        title="No issues recorded"
        description="Material consumption issued to work will be listed here."
      />
    ) : (
      <Table>
        <THead>
          <TR>
            <TH>Date</TH>
            <TH>Item</TH>
            <TH>Project</TH>
            <TH align="right">Qty</TH>
            <TH align="right">Rate</TH>
            <TH align="right">Value</TH>
            <TH>Source</TH>
          </TR>
        </THead>
        <tbody>
          {issues.map((mi) => (
            <TR key={mi.id}>
              <TD>{formatDate(mi.createdAt)}</TD>
              <TD className="font-medium text-fg">{mi.item.name}</TD>
              <TD>{mi.project.name}</TD>
              <TD align="right">{formatNumber(mi.quantity)}</TD>
              <TD align="right">{formatINR(mi.rate)}</TD>
              <TD align="right">{formatINR(mi.value)}</TD>
              <TD>
                <Badge tone={mi.source === "MOBILE" ? "info" : "neutral"}>
                  {mi.source}
                </Badge>
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>
    );

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
            <TH>Items</TH>
            <TH>Required By</TH>
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
                <TD>{itemLabel}</TD>
                <TD>{formatDate(i.requiredBy)}</TD>
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Material Tracking"
        subtitle="Site stock, item master, consumption and indents"
        icon={<Package className="h-5 w-5" />}
      />

      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Stock Value"
          value={stockValue}
          format="inrCompact"
          icon={<IndianRupee className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Items Master"
          value={items.length}
          format="number"
          icon={<Boxes className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="Low-stock Items"
          value={lowStockCount}
          format="number"
          icon={<AlertTriangle className="h-5 w-5" />}
          tone={lowStockCount > 0 ? "danger" : "neutral"}
        />
        <StatCard
          label="Issues Value"
          value={issuesValue}
          format="inrCompact"
          icon={<ArrowDownUp className="h-5 w-5" />}
          tone="success"
        />
      </Reveal>

      <Card>
        <CardBody>
          <Tabs
            items={[
              { key: "stock", label: "Site Stock", count: stockItems.length, content: stockTab },
              { key: "items", label: "Item Master", count: items.length, content: itemTab },
              { key: "issues", label: "Issues / Consumption", count: issues.length, content: issuesTab },
              { key: "indents", label: "Indents", count: indents.length, content: indentsTab },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  );
}
