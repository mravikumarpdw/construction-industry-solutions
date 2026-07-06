import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { parseJSON } from "./utils";
import type { PermissionMatrix } from "./rbac";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-only-change-me"
);
const TTL = Number(process.env.AUTH_TTL_SECONDS || 604800);
export const SESSION_COOKIE = "cis_session";

export interface SessionPayload {
  uid: string;
  tid: string;
  roleKey: string;
  name: string;
  [key: string]: unknown;
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL}s`)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL,
  };
}

// Read the session from the request cookie (server components / route handlers)
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export interface CurrentUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  roleKey: string;
  roleName: string;
  permissions: PermissionMatrix;
  projectIds: string[]; // scoped project assignments (empty = all, for admin/md)
  scopeAll: boolean;
  avatarUrl: string | null;
  designation: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.uid },
    include: { role: true, assignments: true },
  });
  if (!user || !user.isActive) return null;

  const permissions = parseJSON<PermissionMatrix>(user.role.permissions, {});
  // admin & md see all projects; others scoped to assignments
  const scopeAll = ["admin", "md", "accounts"].includes(user.role.key);

  return {
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    roleKey: user.role.key,
    roleName: user.role.name,
    permissions,
    projectIds: user.assignments.map((a) => a.projectId),
    scopeAll,
    avatarUrl: user.avatarUrl,
    designation: user.designation,
  };
}
