import "server-only";
import { db } from "./db";
import type { CurrentUser } from "./auth";

// Where-clause for Project queries respecting tenant + assignment scope.
export function projectWhere(user: CurrentUser) {
  if (user.scopeAll || user.projectIds.length === 0) {
    return { tenantId: user.tenantId };
  }
  return { tenantId: user.tenantId, id: { in: user.projectIds } };
}

// Where-clause for transaction tables that carry projectId.
export function txWhere(user: CurrentUser) {
  if (user.scopeAll || user.projectIds.length === 0) {
    return { tenantId: user.tenantId };
  }
  return { tenantId: user.tenantId, projectId: { in: user.projectIds } };
}

// Resolve the in-scope project ids (null → all projects of tenant).
export async function scopedProjectIds(user: CurrentUser): Promise<string[]> {
  const projects = await db.project.findMany({
    where: projectWhere(user),
    select: { id: true },
  });
  return projects.map((p) => p.id);
}
