import { handler, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

// Current user profile + permissions (used by mobile app + web client).
export const GET = handler(async (user) => {
  return ok({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.roleName,
    roleKey: user.roleKey,
    permissions: user.permissions,
    projectIds: user.projectIds,
    scopeAll: user.scopeAll,
  });
});
