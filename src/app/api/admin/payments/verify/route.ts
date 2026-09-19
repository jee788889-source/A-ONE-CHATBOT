import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { isManagerOrOwner, logAuditEvent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendText } from "@/lib/whatsapp/client";
import { clientIp } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const verifySchema = z.object({
  orderId: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isManagerOrOwner(session)) {
    return Response.json(
      { ok: false, error: "Unauthorized. Owner or Manager access required." },
      { status: 403 }
    );
  }

  const parsed = verifySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Invalid order ID." }, { status: 400 });
  }

  const { orderId, notes } = parsed.data;
  const ip = clientIp(req);

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      return Response.json({ ok: false, error: "Order not found." }, { status: 404 });
    }

    if (order.paymentStatus === "PAID") {
      return Response.json({ ok: false, error: "Payment already verified." }, { status: 400 });
    }

    // Update order payment status and kitchen status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        paymentVerifiedBy: session.name || session.email,
        paymentVerifiedAt: new Date(),
        paymentNotes: notes || order.paymentNotes || "Verified by authorized manager",
        status: order.status === "NEW" ? "CONFIRMED" : order.status,
      },
    });

    // Create Audit Log
    await logAuditEvent({
      actorId: session.sub,
      actorEmail: session.email,
      action: "PAYMENT_VERIFIED",
      target: order.orderNumber,
      details: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerPhone: order.customerPhone,
        amount: order.total,
        verifiedBy: session.name,
        notes,
      },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    // Notify customer via WhatsApp
    if (order.customerPhone) {
      const confirmMsg =
        `✅ *Payment Received & Verified!*\n\n` +
        `Assalam-o-Alaikum, ${order.customerName}!\n` +
        `Aap ke Order *#${order.orderNumber}* ki online payment (Rs. ${order.total?.toLocaleString()}) receive ho gayi hai aur verify kar li gayi hai.\n\n` +
        `👨‍🍳 Kitchen mein aap ka fresh order prepare ho raha hai. Shukriya!\n\n` +
        `_A-ONE Restaurant — Authentic Taste & Quality_`;

      await sendText(order.customerPhone, confirmMsg).catch((err) =>
        console.error("[payments:verify] WA notification error:", err)
      );
    }

    return Response.json({ ok: true, order: updatedOrder });
  } catch (error) {
    console.error("[payment verify] error:", error);
    return Response.json(
      { ok: false, error: "Failed to process payment verification." },
      { status: 500 }
    );
  }
}
