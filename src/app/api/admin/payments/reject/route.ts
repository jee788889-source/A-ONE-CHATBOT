import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { isManagerOrOwner, logAuditEvent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendText } from "@/lib/whatsapp/client";
import { clientIp } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rejectSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(1, "Reason is required"),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isManagerOrOwner(session)) {
    return Response.json(
      { ok: false, error: "Unauthorized. Owner or Manager access required." },
      { status: 403 }
    );
  }

  const parsed = rejectSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Rejection reason is required." }, { status: 400 });
  }

  const { orderId, reason } = parsed.data;
  const ip = clientIp(req);

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      return Response.json({ ok: false, error: "Order not found." }, { status: 404 });
    }

    // Update order payment status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "REJECTED",
        paymentVerifiedBy: session.name || session.email,
        paymentVerifiedAt: new Date(),
        paymentNotes: `Payment Rejected: ${reason}`,
      },
    });

    // Create Audit Log
    await logAuditEvent({
      actorId: session.sub,
      actorEmail: session.email,
      action: "PAYMENT_REJECTED",
      target: order.orderNumber,
      details: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerPhone: order.customerPhone,
        amount: order.total,
        rejectedBy: session.name,
        reason,
      },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    // Notify customer via WhatsApp
    if (order.customerPhone) {
      const rejectMsg =
        `⚠️ *Payment Verification Update*\n\n` +
        `Assalam-o-Alaikum, ${order.customerName}!\n` +
        `Aap ke Order *#${order.orderNumber}* ki online payment verify nahi ho saki.\n\n` +
        `📝 *Reason:* ${reason}\n\n` +
        `Baraye meherbani sahi Transaction ID / Screenshot dobara WhatsApp par bhej dein ya hamare manager se rabta karein taake aap ka order prepare kiya ja sake.\n\n` +
        `_A-ONE Restaurant Operations_`;

      await sendText(order.customerPhone, rejectMsg).catch((err) =>
        console.error("[payments:reject] WA notification error:", err)
      );
    }

    return Response.json({ ok: true, order: updatedOrder });
  } catch (error) {
    console.error("[payment reject] error:", error);
    return Response.json(
      { ok: false, error: "Failed to record payment rejection." },
      { status: 500 }
    );
  }
}
