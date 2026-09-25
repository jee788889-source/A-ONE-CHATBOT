import { prisma } from "@/lib/db";
import type { ConversationStatus, Channel } from "@prisma/client";

export interface ConversationRecord {
  id: string;
  customerId: string;
  customerPhone: string;
  customerName?: string | null;
  customerAddress?: string | null;
  customerNotes?: string | null;
  totalOrders: number;
  totalSpent: number;
  recentOrders: any[];
  channel: Channel;
  status: ConversationStatus;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  unreadCount: number;
  lastMessageAt: Date;
  lastMessageContent: string;
  createdAt: Date;
}

// Clean in-memory conversation store initialized with ZERO demo records
const memoryConversations: ConversationRecord[] = [];

export async function fetchConversations(status?: string | null, search?: string | null) {
  try {
    const where: any = {};
    if (status) where.status = status;
    if (search?.trim()) {
      const s = search.trim();
      where.customer = {
        OR: [
          { name: { contains: s, mode: "insensitive" } },
          { phone: { contains: s, mode: "insensitive" } },
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

    if (conversations) {
      return conversations.map((conv) => ({
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
    }
  } catch (err: any) {
    console.warn("[conversation-store:fetchConversations] database notice:", err?.message || err);
  }

  let filtered = [...memoryConversations];
  if (status) filtered = filtered.filter((c) => c.status === status);
  if (search?.trim()) {
    const s = search.trim().toLowerCase();
    filtered = filtered.filter(
      (c) =>
        (c.customerName && c.customerName.toLowerCase().includes(s)) ||
        c.customerPhone.toLowerCase().includes(s) ||
        c.lastMessageContent.toLowerCase().includes(s)
    );
  }
  return filtered;
}

export async function deleteConversation(id: string): Promise<{ ok: boolean }> {
  try {
    await prisma.conversation.delete({
      where: { id },
    });
  } catch (err: any) {
    console.warn("[conversation-store:deleteConversation] db delete notice:", err?.message || err);
  }

  const idx = memoryConversations.findIndex((c) => c.id === id);
  if (idx !== -1) {
    memoryConversations.splice(idx, 1);
  }
  return { ok: true };
}

