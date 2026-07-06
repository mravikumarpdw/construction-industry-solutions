import { NextResponse } from "next/server";
import { getCurrentUser, type CurrentUser } from "./auth";
import { can, type Action, type ModuleKey } from "./rbac";

export function ok<T>(data: T, init?: number) {
  return NextResponse.json({ ok: true, data }, { status: init ?? 200 });
}

export function fail(message: string, status = 400, extra?: unknown) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra ? { details: extra } : {}) },
    { status }
  );
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// Ensure a user is authenticated; throws ApiError(401) otherwise.
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError("Not authenticated", 401);
  return user;
}

// Ensure a user has a permission on a module (V-13). Throws ApiError(403).
export async function requirePermission(
  module: ModuleKey,
  action: Action = "view"
): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user.permissions, module, action)) {
    throw new ApiError(`Not permitted to ${action} ${module}`, 403);
  }
  return user;
}

// Prisma where-fragment enforcing tenant + project scope in queries, not UI
// alone (V-13). Admin/MD/Accounts see the whole tenant; others only assigned
// projects.
export function scopeWhere(user: CurrentUser) {
  if (user.scopeAll || user.projectIds.length === 0) {
    return { tenantId: user.tenantId };
  }
  return { tenantId: user.tenantId, projectId: { in: user.projectIds } };
}

export function projectScope(user: CurrentUser): string[] | null {
  if (user.scopeAll || user.projectIds.length === 0) return null; // all
  return user.projectIds;
}

// Wrap a route handler with unified auth + error handling.
export function handler(
  fn: (user: CurrentUser, req: Request, ctx: { params: Record<string, string> }) => Promise<Response>,
  opts?: { module?: ModuleKey; action?: Action }
) {
  return async (req: Request, ctx: { params: Record<string, string> }) => {
    try {
      const user = opts?.module
        ? await requirePermission(opts.module, opts.action)
        : await requireUser();
      return await fn(user, req, ctx);
    } catch (e) {
      if (e instanceof ApiError) return fail(e.message, e.status);
      console.error("[API ERROR]", e);
      const msg = e instanceof Error ? e.message : "Internal error";
      return fail(msg, 500);
    }
  };
}
