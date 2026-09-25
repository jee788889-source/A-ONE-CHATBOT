import { NextRequest } from "next/server";
import { getSession, isOwner } from "@/lib/session";
import { logAuditEvent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientIp } from "@/lib/api";
import { deleteConversation } from "@/lib/conversation-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  
  const isOwnerUser =
    isOwner(session) ||
    session?.role === "OWNER" ||
    (session?.role as string)?.toUpperCase() === "ADMIN_OWNER" ||
    (session?.role as string)?.toLowerCase() === "owner";

  if (!session || !isOwnerUser) {
    return Response.json(
      {
        ok: false,
        error: "Forbidden. Only the Restaurant Owner can delete conversation threads.",
      },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  if (!id) {
    return Response.json({ ok: false, error: "Conversation ID required" }, { status: 400 });
  }

  try {
    const existing = await prisma.conversation.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!existing) {
      await deleteConversation(id);
      return Response.json({ ok: true, message: "Conversation already removed." });
    }

    await prisma.message.deleteMany({
      where: { conversationId: id },
    });

    await prisma.conversation.delete({
      where: { id },
    });

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

    return Response.json({
      ok: true,
      message: "Conversation thread and message history successfully purged.",
    });
  } catch (error: any) {
    console.error("[DELETE /api/admin/conversations/[id]] error:", error);
    return Response.json(
      { ok: false, error: error?.message || "Failed to delete conversation." },
      { status: 500 }
    );
  }
}
