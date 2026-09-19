import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { canAccessAdmin, logAuditEvent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendText } from "@/lib/whatsapp/client";
import { clientIp } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!canAccessAdmin(session)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return Response.json({ ok: false, error: "conversationId is required" }, { status: 400 });
  }

  try {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    // Mark unread as 0 when viewing
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });

    return Response.json({ ok: true, messages });
  } catch (error) {
    console.error("[messages GET] error:", error);
    return Response.json({ ok: false, error: "Failed to fetch messages." }, { status: 500 });
  }
}

const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!canAccessAdmin(session)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const parsed = sendMessageSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Invalid message payload." }, { status: 400 });
  }

  const { conversationId, content } = parsed.data;
  const ip = clientIp(req);

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { customer: true },
    });

    if (!conversation) {
      return Response.json({ ok: false, error: "Conversation not found" }, { status: 404 });
    }

    // 1. Save staff message in DB
    const message = await prisma.message.create({
      data: {
        conversationId,
        role: "STAFF",
        content,
        messageType: "TEXT",
        status: "SENT",
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        assignedStaffId: session?.sub,
      },
    });

    // 2. Dispatch via WhatsApp if channel is WhatsApp
    if (conversation.channel === "WHATSAPP" && conversation.customer.phone) {
      const res = await sendText(conversation.customer.phone, content);
      if (res.ok && res.messageId) {
        await prisma.message.update({
          where: { id: message.id },
          data: { whatsappMessageId: res.messageId, status: "DELIVERED" },
        });
      }
    }

    await logAuditEvent({
      actorId: session?.sub,
      actorEmail: session?.email || "staff",
      action: "MESSAGE_SENT",
      target: conversation.customer.phone,
      details: { conversationId, messageId: message.id },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({ ok: true, message }, { status: 201 });
  } catch (error) {
    console.error("[messages POST] error:", error);
    return Response.json({ ok: false, error: "Failed to send message." }, { status: 500 });
  }
}
