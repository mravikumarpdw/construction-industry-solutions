import {
  Users,
  Smartphone,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  HardHat,
  MapPin,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { txWhere } from "@/lib/scope";
import { formatINR } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/utils";
import { formatNumber } from "@/lib/money";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TR, TH, TD } from "@/components/ui/table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Reveal } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

function GeofenceBadge({ inside }: { inside: boolean }) {
  return inside ? (
    <Badge tone="success">
      <CheckCircle2 className="h-3 w-3" /> Inside
    </Badge>
  ) : (
    <Badge tone="danger">
      <MapPin className="h-3 w-3" /> Outside
    </Badge>
  );
}

export default async function AttendancePage() {
  const user = (await getCurrentUser())!;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    onSiteIds,
    totalWorkforce,
    flaggedCount,
    wageAgg,
    todayPunches,
    workers,
    wageSheets,
    flaggedPunches,
  ] = await Promise.all([
    db.attendancePunch.findMany({
      where: { ...txWhere(user), date: { gte: startOfToday }, status: { not: "A" } },
      select: { workerId: true },
      distinct: ["workerId"],
    }),
    db.worker.count({ where: { tenantId: user.tenantId } }),
    db.attendancePunch.count({ where: { ...txWhere(user), flagged: true } }),
    db.wageSheet.aggregate({ where: txWhere(user), _sum: { gross: true } }),
    db.attendancePunch.findMany({
      where: { ...txWhere(user), date: { gte: startOfToday } },
      include: { worker: true, project: true },
      orderBy: { checkInAt: "desc" },
      take: 60,
    }),
    db.worker.findMany({
      where: { tenantId: user.tenantId },
      include: { contractor: true },
      take: 100,
      orderBy: { code: "asc" },
    }),
    db.wageSheet.findMany({
      where: txWhere(user),
      include: { project: true },
      orderBy: { createdAt: "desc" },
    }),
    db.attendancePunch.findMany({
      where: { ...txWhere(user), flagged: true },
      include: { worker: true },
      orderBy: { date: "desc" },
      take: 50,
    }),
  ]);

  // Seed may use past dates → fall back to most recent punches for the muster.
  const musterIsRecent = todayPunches.length === 0;
  const musterPunches = musterIsRecent
    ? await db.attendancePunch.findMany({
        where: txWhere(user),
        include: { worker: true, project: true },
        orderBy: { checkInAt: "desc" },
        take: 60,
      })
    : todayPunches;

  const wagesThisCycle = wageAgg._sum.gross ?? 0;

  const musterTab = (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{musterIsRecent ? "Recent Punches" : "Today's Muster"}</CardTitle>
          <p className="mt-0.5 text-xs text-muted">
            {musterIsRecent
              ? "No punches recorded for today — showing the most recent site punches."
              : "Live geo-tagged attendance captured on the mobile app."}
          </p>
        </div>
        <Badge tone="info">
          <Smartphone className="h-3 w-3" /> Source: Mobile
        </Badge>
      </CardHeader>
      <CardBody>
        {musterPunches.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="No attendance punches"
            description="Attendance punched from the site mobile app will appear here."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Worker</TH>
                <TH>Project</TH>
                <TH>Status</TH>
                <TH>In</TH>
                <TH align="right">Hours</TH>
                <TH align="right">OT</TH>
                <TH>Geofence</TH>
                <TH>Source</TH>
              </TR>
            </THead>
            <tbody>
              {musterPunches.map((p) => (
                <TR key={p.id}>
                  <TD>
                    <div className="flex flex-col">
                      <span className="flex items-center gap-1.5 font-medium text-fg">
                        {p.worker.name}
                        {p.flagged && (
                          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                        )}
                      </span>
                      <span className="text-xs text-muted">{p.worker.trade ?? "—"}</span>
                    </div>
                  </TD>
                  <TD>{p.project.name}</TD>
                  <TD>
                    <StatusBadge status={p.status} />
                  </TD>
                  <TD>{formatDateTime(p.checkInAt)}</TD>
                  <TD align="right">{formatNumber(p.hours)}</TD>
                  <TD align="right">{p.otHours > 0 ? formatNumber(p.otHours) : "—"}</TD>
                  <TD>
                    <GeofenceBadge inside={p.withinGeofence} />
                  </TD>
                  <TD>
                    <Badge tone="info">
                      <Smartphone className="h-3 w-3" /> Mobile
                    </Badge>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );

  const workersTab = (
    <Card>
      <CardHeader>
        <CardTitle>Workforce Register</CardTitle>
        <span className="text-xs text-muted">{formatNumber(workers.length)} workers</span>
      </CardHeader>
      <CardBody>
        {workers.length === 0 ? (
          <EmptyState icon={<HardHat className="h-5 w-5" />} title="No workers registered" />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Code</TH>
                <TH>Name</TH>
                <TH>Trade</TH>
                <TH>Category</TH>
                <TH>Wage Type</TH>
                <TH align="right">Rate</TH>
                <TH>Contractor</TH>
              </TR>
            </THead>
            <tbody>
              {workers.map((w) => (
                <TR key={w.id}>
                  <TD className="font-medium text-fg">{w.code}</TD>
                  <TD>{w.name}</TD>
                  <TD>{w.trade ?? "—"}</TD>
                  <TD>
                    <Badge tone={w.category === "own" ? "brand" : w.category === "nmr" ? "neutral" : "purple"}>
                      {w.category}
                    </Badge>
                  </TD>
                  <TD className="capitalize">{w.wageType}</TD>
                  <TD align="right">{formatINR(w.rate)}</TD>
                  <TD>{w.contractor?.name ?? "—"}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );

  const wageTab = (
    <Card>
      <CardHeader>
        <CardTitle>Wage Sheets</CardTitle>
        <span className="text-xs text-muted">Gross this cycle {formatINR(wagesThisCycle, { compact: true })}</span>
      </CardHeader>
      <CardBody>
        {wageSheets.length === 0 ? (
          <EmptyState title="No wage sheets" description="Fortnightly / monthly wage runs will appear here." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Period</TH>
                <TH>Project</TH>
                <TH align="right">Gross</TH>
                <TH align="right">Deductions</TH>
                <TH align="right">Net</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <tbody>
              {wageSheets.map((s) => (
                <TR key={s.id}>
                  <TD className="whitespace-nowrap font-medium text-fg">
                    {formatDate(s.periodStart)} – {formatDate(s.periodEnd)}
                  </TD>
                  <TD>{s.project.name}</TD>
                  <TD align="right">{formatINR(s.gross)}</TD>
                  <TD align="right">{formatINR(s.deductions)}</TD>
                  <TD align="right">{formatINR(s.net)}</TD>
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
  );

  const fraudTab = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-warning" /> Anti-fraud / Flagged Punches
        </CardTitle>
        <span className="text-xs text-muted">{formatNumber(flaggedPunches.length)} flagged</span>
      </CardHeader>
      <CardBody>
        {flaggedPunches.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="No anomalies"
            description="No punches have been flagged by the geofence / anti-fraud checks."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Worker</TH>
                <TH>Date</TH>
                <TH>Flag Reason</TH>
                <TH>Geofence</TH>
              </TR>
            </THead>
            <tbody>
              {flaggedPunches.map((p) => (
                <TR key={p.id}>
                  <TD>
                    <div className="flex flex-col">
                      <span className="font-medium text-fg">{p.worker.name}</span>
                      <span className="text-xs text-muted">{p.worker.trade ?? "—"}</span>
                    </div>
                  </TD>
                  <TD>{formatDate(p.date)}</TD>
                  <TD>{p.flagReason ?? "Anomaly detected"}</TD>
                  <TD>
                    <GeofenceBadge inside={p.withinGeofence} />
                  </TD>
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
      <PageHeader
        title="Site Attendance"
        subtitle="Geo-tagged attendance, musters and wage calculation"
        icon={<Users className="h-5 w-5" />}
      />

      <div className="flex items-start gap-3 rounded-2xl border border-brand-500/20 bg-brand-500/5 px-4 py-3">
        <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
        <p className="text-sm text-fg-soft">
          Attendance is captured on the{" "}
          <span className="font-medium text-fg">site mobile app</span> (source{" "}
          <span className="font-medium text-fg">MOBILE</span>) with GPS location and a
          selfie, then streams live into this web view — demonstrating end-to-end
          mobile-to-web tracking with geofence validation and anti-fraud flagging.
        </p>
      </div>

      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="On Site Today"
          value={onSiteIds.length}
          format="number"
          icon={<HardHat className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="Total Workforce"
          value={totalWorkforce}
          format="number"
          icon={<Users className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Flagged Punches"
          value={flaggedCount}
          format="number"
          icon={<ShieldAlert className="h-5 w-5" />}
          tone={flaggedCount > 0 ? "danger" : "neutral"}
        />
        <StatCard
          label="Wages this cycle"
          value={wagesThisCycle}
          format="inrCompact"
          icon={<MapPin className="h-5 w-5" />}
          tone="info"
        />
      </Reveal>

      <Tabs
        items={[
          {
            key: "muster",
            label: musterIsRecent ? "Recent Punches" : "Today's Muster",
            count: musterPunches.length,
            content: musterTab,
          },
          { key: "workers", label: "Workers", count: workers.length, content: workersTab },
          { key: "wages", label: "Wage Sheets", count: wageSheets.length, content: wageTab },
          {
            key: "fraud",
            label: "Anti-fraud / Flagged",
            count: flaggedPunches.length,
            content: fraudTab,
          },
        ]}
      />
    </div>
  );
}
