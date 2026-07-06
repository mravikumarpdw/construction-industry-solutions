import { db } from "./db";

// Records an entry in the human-readable activity feed. `source` distinguishes
// WEB vs MOBILE so that site-app actions are tracked and shown in the web app
// (a core product requirement).
export async function logActivity(input: {
  tenantId: string;
  projectId?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  type: string;
  title: string;
  detail?: string | null;
  source?: "WEB" | "MOBILE" | "SYSTEM";
  deviceId?: string | null;
  lat?: number | null;
  lng?: number | null;
  meta?: Record<string, unknown> | null;
}) {
  return db.activityEvent.create({
    data: {
      tenantId: input.tenantId,
      projectId: input.projectId ?? null,
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
      type: input.type,
      title: input.title,
      detail: input.detail ?? null,
      source: input.source ?? "WEB",
      deviceId: input.deviceId ?? null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      meta: input.meta ? JSON.stringify(input.meta) : null,
    },
  });
}

// Immutable audit trail (ERP-025, V-09).
export async function logAudit(input: {
  tenantId: string;
  projectId?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  source?: "WEB" | "MOBILE" | "SYSTEM";
}) {
  return db.auditLog.create({
    data: {
      tenantId: input.tenantId,
      projectId: input.projectId ?? null,
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      before: input.before ? JSON.stringify(input.before) : null,
      after: input.after ? JSON.stringify(input.after) : null,
      source: input.source ?? "WEB",
    },
  });
}

// Raise an exception alert (RPT-003).
export async function raiseAlert(input: {
  tenantId: string;
  projectId?: string | null;
  type: string;
  severity?: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}) {
  return db.alert.create({
    data: {
      tenantId: input.tenantId,
      projectId: input.projectId ?? null,
      type: input.type,
      severity: input.severity ?? "medium",
      title: input.title,
      message: input.message,
      entityType: input.entityType,
      entityId: input.entityId,
    },
  });
}
