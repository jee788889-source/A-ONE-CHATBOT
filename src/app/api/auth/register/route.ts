import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, signSession, SESSION_COOKIE, logAuditEvent } from "@/lib/auth";
import { config } from "@/lib/config";
import { clientIp } from "@/lib/api";
import type { Role } from "@prisma/client";

export const runtime = "nodejs";

const activateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6).max(128),
  inviteCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const parsed = activateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Please enter your full name, valid email, and 6+ character password." },
      { status: 400 }
    );
  }

  const { email, name, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    // 1. Check if user is pre-authorized in the database (e.g. status: INVITED or invited by Owner)
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    }).catch(() => null);

    const isOwnerEmail =
      normalizedEmail === "owner@aonefoods.com" ||
      Boolean(config.app.ownerEmail && normalizedEmail === config.app.ownerEmail.toLowerCase());
    const isManagerEmail = normalizedEmail === "manager@aonefoods.com";
    const isStaffEmail = normalizedEmail === "staff@aonefoods.com";

    // 2. Reject unauthorized arbitrary public visitors
    if (!user && !isOwnerEmail && !isManagerEmail && !isStaffEmail) {
      await logAuditEvent({
        actorEmail: normalizedEmail,
        action: "UNAUTHORIZED_SIGNUP_ATTEMPT",
        target: "AUTH_REGISTER",
        details: { reason: "Email not authorized on A-ONE team allowlist" },
        ipAddress: ip,
        userAgent: req.headers.get("user-agent") || undefined,
      });

      return Response.json(
        {
          ok: false,
          error:
            "Access Restricted: This email is not authorized. Only invited A-ONE Restaurant team members can activate accounts.",
        },
        { status: 403 }
      );
    }

    const passwordHash = await hashPassword(password);
    const assignedRole: Role = isOwnerEmail ? "OWNER" : isManagerEmail ? "MANAGER" : user?.role || "STAFF";

    if (user) {
      // Activate existing invited user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name,
          passwordHash,
          status: "ACTIVE",
          lastActiveAt: new Date(),
        },
      });
    } else {
      // Create active account for authorized initial role email
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name,
          passwordHash,
          role: assignedRole,
          status: "ACTIVE",
          permissions: assignedRole === "OWNER" ? ["all"] : assignedRole === "MANAGER" ? ["view_conversations", "manage_menu"] : ["view_conversations"],
        },
      });
    }

    const token = await signSession({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      permissions: user.permissions,
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "ACCOUNT_ACTIVATED",
      target: "PORTAL",
      details: { role: user.role },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    const res = Response.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });

    res.headers.append("Set-Cookie", cookie(SESSION_COOKIE, token, config.isProd));
    return res;
  } catch (error) {
    console.error("[register POST] error:", error);
    return Response.json({ ok: false, error: "Failed to activate account. Please try again." }, { status: 500 });
  }
}

function cookie(name: string, value: string, secure: boolean): string {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${60 * 60 * 24 * 7}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
