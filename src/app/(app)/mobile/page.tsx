import { Smartphone } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { MobileSimulator } from "./mobile-simulator";

export const dynamic = "force-dynamic";

export default async function MobilePage() {
  const user = (await getCurrentUser())!;
  const projects = await db.project.findMany({
    where: projectWhere(user),
    select: { id: true, name: true, code: true, location: true },
    orderBy: { createdAt: "asc" },
  });

  const mobileToday = await db.activityEvent.count({
    where: { tenantId: user.tenantId, source: "MOBILE" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mobile Live — Site ⇆ Office"
        subtitle="Actions captured on the site app appear here in real time. This is the same API the Android & tablet apps will use."
        icon={<Smartphone className="h-5 w-5" />}
      />
      <MobileSimulator
        projects={projects}
        totalMobileEvents={mobileToday}
        actorName={user.name}
      />
    </div>
  );
}
