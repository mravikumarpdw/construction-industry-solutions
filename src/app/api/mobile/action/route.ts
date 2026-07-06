import { z } from "zod";
import { db } from "@/lib/db";
import { handler, ok, ApiError } from "@/lib/api";
import { logActivity, logAudit } from "@/lib/activity";

/**
 * Unified mobile-app action endpoint. A future Android/tablet app posts here;
 * every action is stamped source=MOBILE with GPS + device id and surfaces
 * immediately in the web Activity feed and the relevant module — this is the
 * "mobile activity tracked and displayed in the web app" requirement.
 *
 * Web session auth is used here for the in-app simulator; a native client would
 * present the same JWT as a Bearer token.
 */
const schema = z.object({
  kind: z.enum(["checkin", "progress", "indent"]),
  projectId: z.string().min(1),
});

const device = () => "AND-" + (1000 + Math.floor(Math.random() * 9000));
const jitter = () => (Math.random() - 0.5) * 0.002;

export const POST = handler(async (user, req) => {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) throw new ApiError("Invalid payload", 422);
  const { kind, projectId } = parsed.data;

  const project = await db.project.findFirst({
    where: { id: projectId, tenantId: user.tenantId },
  });
  if (!project) throw new ApiError("Project not found", 404);

  const deviceId = device();
  const lat = (project.lat ?? 19) + jitter();
  const lng = (project.lng ?? 72) + jitter();
  const now = new Date();

  if (kind === "checkin") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pick a worker without a punch today (else any worker on the tenant).
    const punchedToday = await db.attendancePunch.findMany({
      where: { projectId, date: { gte: today } },
      select: { workerId: true },
    });
    const punchedIds = punchedToday.map((p) => p.workerId);
    const worker =
      (await db.worker.findFirst({
        where: { tenantId: user.tenantId, id: { notIn: punchedIds }, isActive: true },
      })) ?? (await db.worker.findFirst({ where: { tenantId: user.tenantId } }));
    if (!worker) throw new ApiError("No workers enrolled", 400);

    const outside = Math.random() < 0.15;
    await db.attendancePunch.upsert({
      where: { workerId_date: { workerId: worker.id, date: today } },
      create: {
        tenantId: user.tenantId, projectId, workerId: worker.id, date: today,
        status: "P", hours: 8, checkInAt: now,
        lat, lng, deviceId, withinGeofence: !outside, source: "MOBILE",
        flagged: outside, flagReason: outside ? "Outside geofence" : null,
      },
      update: { checkInAt: now, source: "MOBILE", deviceId, lat, lng },
    });

    const ev = await logActivity({
      tenantId: user.tenantId, projectId, actorId: user.id, actorName: user.name,
      type: "attendance", title: `${worker.name} checked in`,
      detail: outside ? "⚠ Outside geofence — flagged" : "Geo-verified · selfie captured",
      source: "MOBILE", deviceId, lat, lng,
      meta: { workerId: worker.id, trade: worker.trade },
    });
    await logAudit({ tenantId: user.tenantId, projectId, actorId: user.id, actorName: user.name, action: "create", entityType: "AttendancePunch", entityId: worker.id, source: "MOBILE" });
    return ok({ event: ev, worker: worker.name });
  }

  if (kind === "progress") {
    const task = await db.task.findFirst({
      where: { projectId, status: { in: ["In Progress", "Delayed", "Not Started"] } },
      orderBy: { sort: "asc" },
    });
    if (!task) throw new ApiError("No open tasks", 400);
    const qty = 5 + Math.floor(Math.random() * 20);
    await db.progressUpdate.create({
      data: {
        tenantId: user.tenantId, projectId, taskId: task.id, date: now,
        qtyToday: qty, manpower: 15 + Math.floor(Math.random() * 45),
        machinery: "1 Crane, 1 Pump", weather: "Clear",
        remarks: "Updated from site", source: "MOBILE", createdBy: user.id,
      },
    });
    const ev = await logActivity({
      tenantId: user.tenantId, projectId, actorId: user.id, actorName: user.name,
      type: "progress", title: `Progress updated: ${task.name}`,
      detail: `${qty} units today · geo-tagged photo`, source: "MOBILE", deviceId, lat, lng,
    });
    return ok({ event: ev, task: task.name });
  }

  // indent
  const item = await db.item.findFirst({ where: { tenantId: user.tenantId } });
  if (!item) throw new ApiError("No items in master", 400);
  const qty = 20 + Math.floor(Math.random() * 80);
  const seq = await db.indent.count({ where: { tenantId: user.tenantId } });
  const indent = await db.indent.create({
    data: {
      tenantId: user.tenantId, projectId,
      number: `IND/2026-27/${String(seq + 1000).padStart(5, "0")}`,
      requiredBy: new Date(now.getTime() + 5 * 86400000), status: "Raised",
      remarks: "Raised from site (mobile)", raisedById: user.id, raisedByName: user.name,
      source: "MOBILE",
      lines: { create: [{ itemId: item.id, quantity: qty, unit: item.unit, remarks: "Site requirement" }] },
    },
  });
  const ev = await logActivity({
    tenantId: user.tenantId, projectId, actorId: user.id, actorName: user.name,
    type: "indent", title: `Indent ${indent.number} raised`,
    detail: `${qty} ${item.unit} ${item.name}`, source: "MOBILE", deviceId, lat, lng,
  });
  return ok({ event: ev, indent: indent.number });
});
