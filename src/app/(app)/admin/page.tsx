import {
  Settings,
  Users,
  Shield,
  Building2,
  Database,
  Truck,
  Package,
  HardHat,
  UserCog,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, parseJSON } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Reveal } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = (await getCurrentUser())!;
  const tenantWhere = { tenantId: user.tenantId };

  const [
    users,
    roles,
    projectCount,
    vendorCount,
    contractorCount,
    itemCount,
    workerCount,
    equipmentCount,
    costHeadCount,
  ] = await Promise.all([
    db.user.findMany({
      where: tenantWhere,
      include: { role: true },
      orderBy: { createdAt: "asc" },
    }),
    db.role.findMany({ where: tenantWhere, orderBy: { name: "asc" } }),
    db.project.count({ where: tenantWhere }),
    db.vendor.count({ where: tenantWhere }),
    db.contractor.count({ where: tenantWhere }),
    db.item.count({ where: tenantWhere }),
    db.worker.count({ where: tenantWhere }),
    db.equipment.count({ where: tenantWhere }),
    db.costHead.count({ where: tenantWhere }),
  ]);

  const mastersTotal =
    vendorCount + contractorCount + itemCount + workerCount + equipmentCount;

  const masterTiles = [
    { label: "Vendors", count: vendorCount, href: "/procurement", icon: Building2 },
    { label: "Contractors", count: contractorCount, href: "/contractor", icon: HardHat },
    { label: "Items", count: itemCount, href: "/material", icon: Package },
    { label: "Workers", count: workerCount, href: "/attendance", icon: Users },
    { label: "Equipment", count: equipmentCount, href: "/equipment", icon: Truck },
    { label: "Cost Heads", count: costHeadCount, href: "/reports", icon: Layers },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration"
        subtitle="Users, roles, permissions and master data governance"
        icon={<Settings className="h-5 w-5" />}
      />

      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Users"
          value={users.length}
          format="number"
          icon={<Users className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Roles"
          value={roles.length}
          format="number"
          icon={<Shield className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="Projects"
          value={projectCount}
          format="number"
          icon={<Building2 className="h-5 w-5" />}
          tone="neutral"
        />
        <StatCard
          label="Masters"
          value={mastersTotal}
          format="number"
          icon={<Database className="h-5 w-5" />}
          tone="brand"
          sub="Vendors · Contractors · Items · Workers · Equipment"
        />
      </Reveal>

      {/* Users & Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-brand-500" /> Users & Roles
          </CardTitle>
          <span className="text-xs text-muted">{users.length} users</span>
        </CardHeader>
        <CardBody className="p-0">
          {users.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No users" />
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Role</TH>
                  <TH>Designation</TH>
                  <TH>Last Login</TH>
                  <TH align="center">Active</TH>
                </TR>
              </THead>
              <tbody>
                {users.map((u) => (
                  <TR key={u.id}>
                    <TD className="font-medium text-fg">{u.name}</TD>
                    <TD>{u.email}</TD>
                    <TD>
                      <Badge tone="brand">{u.role.name}</Badge>
                    </TD>
                    <TD>{u.designation ?? "—"}</TD>
                    <TD>{formatDateTime(u.lastLoginAt)}</TD>
                    <TD align="center">
                      <Badge tone={u.isActive ? "success" : "danger"}>
                        {u.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Roles & Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand-500" /> Roles & Permission Matrix
          </CardTitle>
          <span className="text-xs text-muted">{roles.length} roles</span>
        </CardHeader>
        <CardBody className="p-0">
          {roles.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No roles" />
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Role</TH>
                  <TH>Key</TH>
                  <TH>Description</TH>
                  <TH align="center">Modules Permitted</TH>
                </TR>
              </THead>
              <tbody>
                {roles.map((r) => {
                  const perms = parseJSON<Record<string, unknown>>(r.permissions, {});
                  const moduleCount = Object.keys(perms).length;
                  return (
                    <TR key={r.id}>
                      <TD className="font-medium text-fg">
                        <span className="flex items-center gap-2">
                          {r.name}
                          {r.isSystem && <Badge tone="purple">System</Badge>}
                        </span>
                      </TD>
                      <TD>
                        <Badge tone="neutral">{r.key}</Badge>
                      </TD>
                      <TD>{r.description ?? "—"}</TD>
                      <TD align="center">
                        <Badge tone="info">{moduleCount}</Badge>
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Master Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4 text-brand-500" /> Master Data
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {masterTiles.map((m) => {
              const Icon = m.icon;
              return (
                <Link
                  key={m.label}
                  href={m.href}
                  className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-2/30 p-4 transition-colors hover:border-brand-300 hover:bg-surface-2/60"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-semibold text-fg tabular">{m.count}</p>
                  <p className="text-xs font-medium text-muted">{m.label}</p>
                </Link>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
