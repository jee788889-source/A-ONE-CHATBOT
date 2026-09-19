import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { canAccessAdmin, isManagerOrOwner, isOwner, logAuditEvent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientIp } from "@/lib/api";
import type { OrderStatus, PaymentStatus } from "@prisma/client";

export const runtime = "nodejs";

const patchOrderSchema = z.object({
  status: z
    .enum(["NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"])
    .optional(),
  assignedStaffId: z.string().nullable().optional(),
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().min(7).optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  cancelledReason: z.string().optional(),
  paymentStatus: z
    .enum(["PENDING", "PENDING_VERIFICATION", "PAID", "CASH_ON_DELIVERY", "FAILED", "REJECTED"])
    .optional(),
  refundReviewNotes: z.string().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().optional(),
        itemName: z.string().min(1),
        unitPrice: z.number().positive(),
        quantity: z.number().int().positive(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  deliveryFee: z.number().optional(),
  discount: z.number().optional(),
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
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        assignedStaff: { select: { id: true, name: true, email: true } },
        customer: true,
      },
    });

    if (!order) {
      return Response.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    return Response.json({ ok: true, order, canEditFinancials: isManagerOrOwner(session) });
  } catch (error) {
    console.error("[order GET id] error:", error);
    return Response.json({ ok: false, error: "Failed to load order." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!canAccessAdmin(session)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = patchOrderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid patch data", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const ip = clientIp(req);
  const userIsManagerOrOwner = isManagerOrOwner(session);

  try {
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!currentOrder) {
      return Response.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    // =========================================================================
    //  STRICT SERVER-SIDE RBAC ENFORCEMENT
    // =========================================================================
    
    // 1. Staff is strictly prohibited from cancelling orders
    if (data.status === "CANCELLED" && !userIsManagerOrOwner) {
      return Response.json(
        {
          ok: false,
          error: "Permission Denied: Staff members cannot cancel orders. Please request Owner or Manager approval.",
        },
        { status: 403 }
      );
    }

    // 2. Staff is prohibited from modifying customer details, financial totals, or items
    if (
      (data.customerName ||
        data.customerPhone ||
        data.deliveryAddress !== undefined ||
        data.items ||
        data.deliveryFee !== undefined ||
        data.discount !== undefined ||
        data.paymentStatus) &&
      !userIsManagerOrOwner
    ) {
      return Response.json(
        {
          ok: false,
          error: "Permission Denied: Only the Owner and Manager can edit customer info, items, or financial details.",
        },
        { status: 403 }
      );
    }

    // 3. Online-Paid Order Protection: If order is PAID / VERIFIED, require strong justification for cancellation
    const isPaidOrder = currentOrder.paymentStatus === "PAID";
    if (isPaidOrder && data.status === "CANCELLED") {
      if (!data.cancelledReason?.trim()) {
        return Response.json(
          {
            ok: false,
            error: "Cancellation reason and refund review notes are mandatory when cancelling a verified paid order.",
          },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    // Status updates
    if (data.status) {
      updateData.status = data.status as OrderStatus;
      if (data.status === "COMPLETED") {
        updateData.deliveredAt = new Date();
      }
      if (data.status === "CANCELLED") {
        updateData.cancelledReason = data.cancelledReason || "Cancelled by Manager/Owner";
        if (isPaidOrder && data.refundReviewNotes) {
          updateData.paymentNotes = `[REFUND REVIEW INITIATED] Reason: ${data.cancelledReason}. Notes: ${data.refundReviewNotes} by ${session?.email}`;
        }
      }
    }

    // Assigned staff update
    if (data.assignedStaffId !== undefined) {
      updateData.assignedStaffId = data.assignedStaffId;
    }

    // Notes
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    // Owner / Manager editable fields
    if (userIsManagerOrOwner) {
      if (data.customerName) updateData.customerName = data.customerName;
      if (data.customerPhone) updateData.customerPhone = data.customerPhone;
      if (data.deliveryAddress !== undefined) updateData.deliveryAddress = data.deliveryAddress;
      if (data.paymentStatus) updateData.paymentStatus = data.paymentStatus as PaymentStatus;
      if (data.deliveryFee !== undefined) updateData.deliveryFee = data.deliveryFee;
      if (data.discount !== undefined) updateData.discount = data.discount;

      // If items were edited, recalculate totals
      if (data.items && data.items.length > 0) {
        const subtotal = data.items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
        const fee = data.deliveryFee !== undefined ? data.deliveryFee : currentOrder.deliveryFee;
        const disc = data.discount !== undefined ? data.discount : currentOrder.discount;
        updateData.subtotal = subtotal;
        updateData.total = subtotal + fee - disc;
      }
    }

    // Execute atomic update
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // If items replaced by manager/owner
      if (userIsManagerOrOwner && data.items && data.items.length > 0) {
        await tx.orderItem.deleteMany({ where: { orderId: id } });
        await tx.orderItem.createMany({
          data: data.items.map((it) => ({
            orderId: id,
            menuItemId: it.menuItemId,
            itemName: it.itemName,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            subtotal: it.unitPrice * it.quantity,
            notes: it.notes,
          })),
        });
      }

      return await tx.order.update({
        where: { id },
        data: updateData,
        include: {
          items: true,
          assignedStaff: { select: { id: true, name: true, email: true } },
          customer: true,
        },
      });
    });

    // Immutable audit logging
    await logAuditEvent({
      actorId: session?.sub,
      actorEmail: session?.email || "staff",
      action: data.status === "CANCELLED" ? "ORDER_CANCELLED" : "ORDER_UPDATED",
      target: updatedOrder.orderNumber,
      details: {
        orderId: id,
        previousStatus: currentOrder.status,
        newStatus: data.status,
        cancelledReason: data.cancelledReason,
        isPaidOrder,
        modifiedByRole: session?.role,
        updatedFields: Object.keys(data),
      },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({ ok: true, order: updatedOrder });
  } catch (error) {
    console.error("[order PATCH] error:", error);
    return Response.json({ ok: false, error: "Failed to update order." }, { status: 500 });
  }
}

/**
 * Orders must never be destructively deleted to preserve financial and audit history.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!canAccessAdmin(session)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return Response.json(
    {
      ok: false,
      error:
        "Orders cannot be deleted to preserve financial integrity and audit history. Please cancel the order with an appropriate reason instead.",
    },
    { status: 405 }
  );
}
