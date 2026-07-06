import { db } from "@/lib/db";
import { handler, ok } from "@/lib/api";
import { scopedProjectIds } from "@/lib/scope";

export const dynamic = "force-dynamic";

// Live mobile activity feed — polled by the web "Mobile Live" view so that
// site-app actions appear in the office in near real time.
export const GET = handler(async (user) => {
  const projectIds = await scopedProjectIds(user);
  const events = await db.activityEvent.findMany({
    where: {
      tenantId: user.tenantId,
      source: "MOBILE",
      ...(user.scopeAll ? {} : { projectId: { in: projectIds } }),
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const projects = await db.project.findMany({
    where: { tenantId: user.tenantId },
    select: { id: true, name: true, code: true },
  });
  const nameById = new Map(projects.map((p) => [p.id, p]));

  return ok(
    events.map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      detail: e.detail,
      source: e.source,
      actorName: e.actorName,
      deviceId: e.deviceId,
      lat: e.lat,
      lng: e.lng,
      projectName: e.projectId ? nameById.get(e.projectId)?.name ?? null : null,
      createdAt: e.createdAt,
    }))
  );
});
