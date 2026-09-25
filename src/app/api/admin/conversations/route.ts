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
    const conv = await prisma.conversation.findUnique({
      where: { id: body.id },
      include: { customer: true },
    });

    if (!conv) {
      return Response.json({ ok: false, error: "Conversation not found." }, { status: 404 });
    }

    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.assignedStaffId !== undefined) updateData.assignedStaffId = body.assignedStaffId;
    if (body.unreadCount !== undefined) updateData.unreadCount = body.unreadCount;

    let systemMessage = null;

    if (body.status === "OPEN" || body.action === "RESUME_AI") {
      updateData.status = "OPEN";
      updateData.lastMessageAt = new Date();

      const resumeText =
        "Staff ke sath conversation complete ho chuki hai. A-One Foods ki automated service wapas active hai!";

      systemMessage = await prisma.message.create({
        data: {
          conversationId: conv.id,
          role: "ASSISTANT",
          content: resumeText,
          messageType: "TEXT",
          status: "SENT",
        },
      });

      if (conv.channel === "WHATSAPP" && conv.customer.phone) {
        try {
          const { sendButtons } = await import("@/lib/whatsapp/client");
          await sendButtons(
            conv.customer.phone,
            resumeText,
            [
              { id: "btn_show_menu", title: "📜 View Menu" },
              { id: "btn_show_deals", title: "🔥 Special Deals" },
              { id: "btn_staff_help", title: "👨‍🍳 Staff Support" },
            ]
          );
        } catch (err: any) {
          console.warn("[PATCH resume AI whatsapp notice]:", err.message);
        }
      }
    } else if (body.action === "STAFF_BUSY") {
      updateData.status = "PENDING";
      updateData.lastMessageAt = new Date();

      const busyText =
        "Hamari team abhi thori busy hai. Jitna jald possible ho saka, hum aapse direct rabta karte hain. Shukriya!";

      systemMessage = await prisma.message.create({
        data: {
          conversationId: conv.id,
          role: "STAFF",
          content: busyText,
          messageType: "TEXT",
          status: "SENT",
        },
      });

      if (conv.channel === "WHATSAPP" && conv.customer.phone) {
        try {
          const { sendText } = await import("@/lib/whatsapp/client");
          await sendText(conv.customer.phone, busyText);
        } catch (err: any) {
          console.warn("[PATCH staff busy whatsapp notice]:", err.message);
        }
      }
    }

    const convUpdated = await prisma.conversation.update({
      where: { id: body.id },
      data: updateData,
      include: {
        customer: true,
        assignedStaff: { select: { id: true, name: true } },
      },
    });

    const auditAction =
      body.action === "STAFF_BUSY"
        ? "STAFF_BUSY_SENT"
        : body.status === "PENDING"
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
        status: convUpdated.status,
        action: body.action,
        assignedStaffId: body.assignedStaffId,
        staffName: session?.name,
      },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({
      ok: true,
      conversation: convUpdated,
      message: systemMessage,
    });
  } catch (error) {
    console.error("[conversations PATCH] error:", error);
    return Response.json({ ok: false, error: "Failed to update conversation." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  const { isOwner } = await import("@/lib/session");
  const isOwnerUser =
    isOwner(session) ||
    session?.role === "OWNER" ||
    (session?.role as string)?.toUpperCase() === "ADMIN_OWNER" ||
    (session?.role as string)?.toLowerCase() === "owner";

  if (!session || !isOwnerUser) {
    return Response.json(
      { ok: false, error: "Forbidden. Only the Restaurant Owner can delete conversation threads." },
      { status: 403 }
    );
  }

  const { searchParams } = req.nextUrl;
  let id = searchParams.get("id");
  if (!id) {
    const body = await req.json().catch(() => null);
    id = body?.id;
  }

  if (!id) {
    return Response.json({ ok: false, error: "Conversation ID required" }, { status: 400 });
  }

  try {
    const { deleteConversation } = await import("@/lib/conversation-store");
    const existing = await prisma.conversation.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!existing) {
      await deleteConversation(id);
      return Response.json({ ok: true, message: "Conversation already removed." });
    }

    await prisma.message.deleteMany({ where: { conversationId: id } });
    await prisma.conversation.delete({ where: { id } });
    await deleteConversation(id);

    const ip = clientIp(req);
    await logAuditEvent({
      actorId: session.sub,
      actorEmail: session.email || "owner",
      action: "CONVERSATION_DELETED_PURGED",
      target: existing.customer.phone,
      details: {
        conversationId: id,
        customerId: existing.customerId,
        customerPhone: existing.customer.phone,
        customerName: existing.customer.name,
        purgedBy: session.name,
      },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({ ok: true, message: "Conversation thread deleted." });
  } catch (error: any) {
    console.error("[conversations DELETE] error:", error);
    return Response.json({ ok: false, error: error?.message || "Failed to delete conversation." }, { status: 500 });
  }
}

