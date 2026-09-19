import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { canAccessAdmin, logAuditEvent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientIp } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!canAccessAdmin(session)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim();

  try {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.customer = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      include: {
        customer: {
          include: {
            orders: {
              orderBy: { createdAt: "desc" },
              take: 5,
              include: { items: true },
            },
          },
        },
        assignedStaff: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const formatted = conversations.map((conv) => ({
      id: conv.id,
      customerId: conv.customerId,
      customerPhone: conv.customer.phone,
      customerName: conv.customer.name,
      customerAddress: conv.customer.address,
      customerNotes: conv.customer.notes,
      totalOrders: conv.customer.totalOrders,
      totalSpent: conv.customer.totalSpent,
      recentOrders: conv.customer.orders || [],
      channel: conv.channel,
      status: conv.status,
      assignedStaffId: conv.assignedStaffId,
      assignedStaffName: conv.assignedStaff?.name || null,
      unreadCount: conv.unreadCount,
      lastMessageAt: conv.lastMessageAt,
      lastMessageContent: conv.messages[0]?.content || "No messages yet",
      createdAt: conv.createdAt,
    }));

    return Response.json({ ok: true, conversations: formatted });
  } catch (error) {
    console.error("[conversations GET] error:", error);
    return Response.json({ ok: false, error: "Failed to fetch conversations." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!canAccessAdmin(session)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.id) {
    return Response.json({ ok: false, error: "Conversation ID required" }, { status: 400 });
  }

  const ip = clientIp(req);

  try {
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.assignedStaffId !== undefined) updateData.assignedStaffId = body.assignedStaffId;
    if (body.unreadCount !== undefined) updateData.unreadCount = body.unreadCount;

    const conv = await prisma.conversation.update({
      where: { id: body.id },
      data: updateData,
      include: {
        customer: true,
        assignedStaff: { select: { id: true, name: true } },
      },
    });

    const auditAction =
      body.status === "PENDING"
        ? "HUMAN_TAKEOVER_ACTIVE"
        : body.status === "OPEN"
        ? "AI_RESUMED"
        : "CONVERSATION_UPDATED";

    await logAuditEvent({
      actorId: session?.sub,
      actorEmail: session?.email || "staff",
      action: auditAction,
      target: conv.customer.phone,
      details: {
        conversationId: conv.id,
        status: body.status,
        assignedStaffId: body.assignedStaffId,
        staffName: session?.name,
      },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({ ok: true, conversation: conv });
  } catch (error) {
    console.error("[conversations PATCH] error:", error);
    return Response.json({ ok: false, error: "Failed to update conversation." }, { status: 500 });
  }
}
