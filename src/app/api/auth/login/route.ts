import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  signToken,
  verifyPassword,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { fail } from "@/lib/api";
import { logAudit } from "@/lib/activity";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("Email and password are required", 422);

    const { email, password } = parsed.data;
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { role: true, tenant: true },
    });
    if (!user || !user.isActive) return fail("Invalid credentials", 401);

    const okPw = await verifyPassword(password, user.passwordHash);
    if (!okPw) return fail("Invalid credentials", 401);

    const token = await signToken({
      uid: user.id,
      tid: user.tenantId,
      roleKey: user.role.key,
      name: user.name,
    });

    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await logAudit({
      tenantId: user.tenantId,
      actorId: user.id,
      actorName: user.name,
      action: "login",
      entityType: "User",
      entityId: user.id,
    });

    const res = NextResponse.json({
      ok: true,
      data: { name: user.name, role: user.role.name },
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (e) {
    console.error(e);
    return fail("Login failed", 500);
  }
}
