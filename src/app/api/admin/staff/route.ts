import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { isOwner, hashPassword, logAuditEvent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { clientIp } from "@/lib/api";
import type { Role, UserStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!isOwner(session)) {
    return Response.json({ ok: false, error: "Only the Owner can manage staff accounts." }, { status: 403 });
  }

  try {
    let users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        lastActiveAt: true,
        createdAt: true,
        permissions: true,
      },
    }).catch(() => []);

    if (!users || users.length === 0) {
      users = [
        {
          id: "owner-1",
          name: "Owner / Administrator",
          email: config.app.ownerEmail || "owner@aonefoods.com",
          phone: "+92 300 0000000",
          role: "OWNER" as Role,
          status: "ACTIVE" as UserStatus,
          avatarUrl: null,
          lastActiveAt: new Date(),
          createdAt: new Date(),
          permissions: ["all"],
        },
      ];
    }

    return Response.json({ ok: true, staff: users, ownerEmail: config.app.ownerEmail });
  } catch (error: any) {
    console.error("[staff GET] error:", error);
    return Response.json({ ok: false, error: error?.message || "Failed to fetch staff list." }, { status: 500 });
  }
}

const createStaffSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  phone: z.string().optional(),
  role: z.enum(["MANAGER", "STAFF"]).default("STAFF"),
  permissions: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!isOwner(session)) {
    return Response.json({ ok: false, error: "Only the Owner can add or invite staff." }, { status: 403 });
  }

  const parsed = createStaffSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Please enter a valid name, email, and 6+ character password." },
      { status: 400 }
    );
  }

  const { name, email, password, phone, role, permissions } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();
  const ip = clientIp(req);

  try {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return Response.json({ ok: false, error: "A staff account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        phone,
        role: role as Role,
        status: "ACTIVE",
        permissions: permissions || [],
        invitedBy: session?.sub,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        createdAt: true,
      },
    });

    await logAuditEvent({
      actorId: session?.sub,
      actorEmail: session?.email || "owner",
      action: "STAFF_CREATED",
      target: user.email,
      details: { staffId: user.id, role: user.role },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({ ok: true, staff: user }, { status: 201 });
  } catch (error) {
    console.error("[staff POST] error:", error);
    return Response.json({ ok: false, error: "Failed to create staff account." }, { status: 500 });
  }
}

const updateStaffSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(["MANAGER", "STAFF"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  password: z.string().min(6).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!isOwner(session)) {
    return Response.json({ ok: false, error: "Only the Owner can modify staff accounts." }, { status: 403 });
  }

  const parsed = updateStaffSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Invalid staff update data." }, { status: 400 });
  }

  const { id, name, phone, role, status, password } = parsed.data;
  const ip = clientIp(req);

  try {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return Response.json({ ok: false, error: "Staff user not found." }, { status: 404 });
    }

    // Owner protection: Never allow modifying owner's status or role through staff endpoint
    if (target.email.toLowerCase() === config.app.ownerEmail.toLowerCase() || target.role === "OWNER") {
      if (role) {
        return Response.json({ ok: false, error: "The Owner account cannot be demoted." }, { status: 403 });
      }
      if (status && status !== "ACTIVE") {
        return Response.json({ ok: false, error: "The Owner account cannot be disabled." }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (role) updateData.role = role as Role;
    if (status) updateData.status = status as UserStatus;
    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        lastActiveAt: true,
      },
    });

    await logAuditEvent({
      actorId: session?.sub,
      actorEmail: session?.email || "owner",
      action: "STAFF_UPDATED",
      target: updated.email,
      details: { staffId: id, changes: { role, status, passwordChanged: Boolean(password) } },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({ ok: true, staff: updated });
  } catch (error) {
    console.error("[staff PATCH] error:", error);
    return Response.json({ ok: false, error: "Failed to update staff account." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!isOwner(session)) {
    return Response.json({ ok: false, error: "Only the Owner can delete staff accounts." }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ ok: false, error: "Staff ID is required" }, { status: 400 });
  }

  const ip = clientIp(req);

  try {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return Response.json({ ok: false, error: "Staff user not found." }, { status: 404 });
    }

    // Owner protection: Never allow deleting the owner account
    if (target.email.toLowerCase() === config.app.ownerEmail.toLowerCase() || target.role === "OWNER") {
      return Response.json({ ok: false, error: "The Owner account cannot be deleted." }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });

    await logAuditEvent({
      actorId: session?.sub,
      actorEmail: session?.email || "owner",
      action: "STAFF_DELETED",
      target: target.email,
      details: { staffId: id },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[staff DELETE] error:", error);
    return Response.json({ ok: false, error: "Failed to delete staff account." }, { status: 500 });
  }
}
