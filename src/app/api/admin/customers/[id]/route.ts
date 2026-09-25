import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { isManagerOrOwner, canAccessAdmin, logAuditEvent } from "@/lib/auth";
import { clientIp } from "@/lib/api";
import { fetchCustomerById, updateCustomerProfile } from "@/lib/customer-store";

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
    const customer = await fetchCustomerById(id);
    if (!customer) {
      return Response.json({ ok: false, error: "Customer not found." }, { status: 404 });
    }

    return Response.json({ ok: true, customer });
  } catch (error: any) {
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
    const updated = await updateCustomerProfile(id, data);

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
  } catch (error: any) {
    console.error("[customer PATCH] error:", error);
    return Response.json({ ok: false, error: "Failed to update customer." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const { isOwner } = await import("@/lib/session");
  const isOwnerUser =
    isOwner(session) ||
    session?.role === "OWNER" ||
    (session?.role as string)?.toUpperCase() === "ADMIN_OWNER" ||
    (session?.role as string)?.toLowerCase() === "owner";

  if (!session || !isOwnerUser) {
    return Response.json(
      { ok: false, error: "Forbidden. Only the Restaurant Owner can permanently delete customer records and history." },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (!id) {
    return Response.json({ ok: false, error: "Customer ID is required." }, { status: 400 });
  }

  const ip = clientIp(req);

  try {
    const existing = await fetchCustomerById(id);
    const { deleteCustomerById } = await import("@/lib/customer-store");
    await deleteCustomerById(id);

    await logAuditEvent({
      actorId: session.sub,
      actorEmail: session.email || "owner",
      action: "CUSTOMER_PERMANENTLY_DELETED",
      target: existing?.phone || id,
      details: {
        customerId: id,
        customerName: existing?.name,
        customerPhone: existing?.phone,
        totalOrdersPurged: existing?.totalOrders,
        purgedBy: session.name,
      },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({
      ok: true,
      message: "Customer profile and complete order/chat history permanently removed.",
    });
  } catch (error: any) {
    console.error("[customer DELETE] error:", error);
    return Response.json(
      { ok: false, error: error?.message || "Failed to delete customer." },
      { status: 500 }
    );
  }
}
