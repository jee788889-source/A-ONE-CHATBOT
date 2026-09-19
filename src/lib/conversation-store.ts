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

const memoryConversations: ConversationRecord[] = [
  {
    id: "conv-1",
    customerId: "cust-1",
    customerPhone: "+92 300 1234567",
    customerName: "Muhammad Usman",
    customerAddress: "House 42-B, Street 5, Phase 5 DHA, Lahore",
    customerNotes: "VIP Customer",
    totalOrders: 14,
    totalSpent: 12850,
    recentOrders: [],
    channel: "WHATSAPP",
    status: "OPEN",
    unreadCount: 1,
    lastMessageAt: new Date(),
    lastMessageContent: "Can I get extra sauce with the beef burger order?",
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: "conv-2",
    customerId: "cust-2",
    customerPhone: "+92 321 9876543",
    customerName: "Ayesha Khan",
    customerAddress: "Flat 304, Gulberg Heights, Main Boulevard, Lahore",
    totalOrders: 9,
    totalSpent: 7420,
    recentOrders: [],
    channel: "WHATSAPP",
    status: "RESOLVED",
    unreadCount: 0,
    lastMessageAt: new Date(Date.now() - 3600000),
    lastMessageContent: "Thank you, the food was delicious!",
    createdAt: new Date(Date.now() - 172800000),
  },
];

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

    if (conversations && conversations.length > 0) {
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
    console.warn("[conversation-store:fetchConversations] db fallback:", err?.message || err);
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
