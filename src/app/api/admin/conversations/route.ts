import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { canAccessAdmin, logAuditEvent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientIp } from "@/lib/api";

import { fetchConversations } from "@/lib/conversation-store";

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
    const conversations = await fetchConversations(status, search);
    return Response.json({ ok: true, conversations });
  } catch (error: any) {
    console.error("[conversations GET] error:", error);
    return Response.json({ ok: false, error: error?.message || "Failed to fetch conversations." }, { status: 500 });
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
