import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { allowedModules, can, type ModuleKey } from "@/lib/rbac";

// First path segment → RBAC module. Enforced server-side (V-13) so navigating
// directly to a URL a role can't access is blocked, not just hidden in the nav.
const PATH_MODULE: Record<string, ModuleKey> = {
  dashboard: "dashboard",
  activity: "activity",
  mobile: "activity",
  projects: "projects",
  procurement: "erp",
  contractor: "contractor",
  "client-billing": "client-billing",
  tendering: "tendering",
  pm: "pm",
  attendance: "attendance",
  material: "material",
  equipment: "equipment",
  qhse: "qhse",
  documents: "documents",
  reports: "reports",
  admin: "admin",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Enforce module access for the requested route.
  const pathname = headers().get("x-pathname") ?? "";
  const segment = pathname.split("/").filter(Boolean)[0];
  const requiredModule = segment ? PATH_MODULE[segment] : undefined;
  if (requiredModule && !can(user.permissions, requiredModule, "view")) {
    notFound();
  }

  const [tenant, alertCount] = await Promise.all([
    db.tenant.findUnique({ where: { id: user.tenantId } }),
    db.alert.count({ where: { tenantId: user.tenantId, isResolved: false } }),
  ]);

  return (
    <AppShell
      user={{ name: user.name, roleName: user.roleName, avatarUrl: user.avatarUrl }}
      tenantName={tenant?.name ?? "Construction Industry Solutions"}
      allowed={allowedModules(user.permissions)}
      alertCount={alertCount}
    >
      {children}
    </AppShell>
  );
}
