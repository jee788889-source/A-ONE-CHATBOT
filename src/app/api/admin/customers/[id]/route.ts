import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { isManagerOrOwner, canAccessAdmin, logAuditEvent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientIp } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const editCustomerSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
  isArchived: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!canAccessAdmin(session)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
        conversations: {
          take: 5,
          orderBy: { lastMessageAt: "desc" },
        },
      },
    });

    if (!customer) {
      return Response.json({ ok: false, error: "Customer not found." }, { status: 404 });
    }

    return Response.json({ ok: true, customer });
  } catch (error) {
    console.error("[customer GET id] error:", error);
    return Response.json({ ok: false, error: "Failed to fetch customer profile." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!isManagerOrOwner(session)) {
    return Response.json(
      { ok: false, error: "Permission Denied: Only Owner and Manager can edit or archive customer profiles." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const parsed = editCustomerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Invalid customer data." }, { status: 400 });
  }

  const data = parsed.data;
  const ip = clientIp(req);

  try {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return Response.json({ ok: false, error: "Customer not found." }, { status: 404 });
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim() || null;
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.email !== undefined) updateData.email = data.email.trim() || null;
    if (data.address !== undefined) updateData.address = data.address.trim() || null;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Handle soft archive: if isArchived is toggled, store in notes tag or field
    if (data.isArchived !== undefined) {
      const currentNotes = customer.notes || "";
      if (data.isArchived) {
        if (!currentNotes.includes("[ARCHIVED]")) {
          updateData.notes = `[ARCHIVED] ${currentNotes}`.trim();
        }
      } else {
        updateData.notes = currentNotes.replace(/\[ARCHIVED\]\s*/g, "").trim();
      }
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    await logAuditEvent({
      actorId: session?.sub || "system",
      actorEmail: session?.email || "unknown",
      action: data.isArchived ? "CUSTOMER_ARCHIVED" : "CUSTOMER_UPDATED",
      target: updated.phone,
      details: {
        customerId: id,
        changes: Object.keys(data),
      },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({ ok: true, customer: updated });
  } catch (error) {
    console.error("[customer PATCH] error:", error);
    return Response.json({ ok: false, error: "Failed to update customer." }, { status: 500 });
  }
}
