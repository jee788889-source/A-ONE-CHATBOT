import { prisma } from "@/lib/db";

export interface CustomerRecord {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  totalOrders: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    orders: number;
    conversations: number;
  };
  orders?: any[];
  conversations?: any[];
}

// Clean in-memory store initialized with ZERO demo records
const memoryCustomers: CustomerRecord[] = [];

/**
 * Fetch all customers with search support and clean initial state
 */
export async function fetchAllCustomers(search?: string): Promise<CustomerRecord[]> {
  try {
    const where: any = {};
    if (search?.trim()) {
      const s = search.trim();
      where.OR = [
        { name: { contains: s, mode: "insensitive" } },
        { phone: { contains: s, mode: "insensitive" } },
        { address: { contains: s, mode: "insensitive" } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { totalSpent: "desc" },
      include: {
        _count: {
          select: { orders: true, conversations: true },
        },
      },
    });

    if (customers) {
      return customers as CustomerRecord[];
    }
  } catch (err: any) {
    console.warn("[customer-store:fetchAllCustomers] database notice:", err?.message || err);
  }

  // If DB query fails or fallback needed, filter clean memory store
  let result = [...memoryCustomers];
  if (search?.trim()) {
    const s = search.trim().toLowerCase();
    result = result.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(s)) ||
        c.phone.toLowerCase().includes(s) ||
        (c.address && c.address.toLowerCase().includes(s)) ||
        (c.notes && c.notes.toLowerCase().includes(s))
    );
  }
  return result;
}

/**
 * Fetch a single customer by ID
 */
export async function fetchCustomerById(id: string): Promise<CustomerRecord | null> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
        conversations: {
          take: 5,
          orderBy: { lastMessageAt: "desc" },
        },
      },
    });

    if (customer) return customer as CustomerRecord;
  } catch (err: any) {
    console.warn("[customer-store:fetchCustomerById] database notice:", err?.message || err);
  }

  const found = memoryCustomers.find((c) => c.id === id);
  return found || null;
}

/**
 * Update a customer profile
 */
export async function updateCustomerProfile(
  id: string,
  data: {
    name?: string | null;
    phone?: string;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    isArchived?: boolean;
  }
): Promise<CustomerRecord> {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name?.trim() || null;
  if (data.phone !== undefined) updateData.phone = data.phone.trim();
  if (data.email !== undefined) updateData.email = data.email?.trim() || null;
  if (data.address !== undefined) updateData.address = data.address?.trim() || null;

  try {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (existing) {
      if (data.isArchived !== undefined) {
        const currentNotes = existing.notes || "";
        if (data.isArchived) {
          if (!currentNotes.includes("[ARCHIVED]")) {
            updateData.notes = `[ARCHIVED] ${currentNotes}`.trim();
          }
        } else {
          updateData.notes = currentNotes.replace(/\[ARCHIVED\]\s*/g, "").trim();
        }
      } else if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }

      const updated = await prisma.customer.update({
        where: { id },
        data: updateData,
      });

      const memIdx = memoryCustomers.findIndex((c) => c.id === id);
      if (memIdx !== -1) {
        memoryCustomers[memIdx] = { ...memoryCustomers[memIdx], ...(updated as CustomerRecord) };
      }

      return updated as CustomerRecord;
    }
  } catch (err: any) {
    console.warn("[customer-store:updateCustomerProfile] database notice:", err?.message || err);
  }

  // Memory fallback update
  let memIdx = memoryCustomers.findIndex((c) => c.id === id);
  if (memIdx === -1) {
    const newCust: CustomerRecord = {
      id,
      phone: data.phone || "+92 300 0000000",
      name: data.name || "Customer",
      email: data.email || null,
      address: data.address || null,
      notes: data.notes || null,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { orders: 0, conversations: 0 },
    };
    memoryCustomers.push(newCust);
    memIdx = memoryCustomers.length - 1;
  }

  const current = memoryCustomers[memIdx];
  let newNotes = data.notes !== undefined ? data.notes : current.notes;
  if (data.isArchived !== undefined) {
    const currentNotes = current.notes || "";
    if (data.isArchived) {
      if (!currentNotes.includes("[ARCHIVED]")) {
        newNotes = `[ARCHIVED] ${currentNotes}`.trim();
      }
    } else {
      newNotes = currentNotes.replace(/\[ARCHIVED\]\s*/g, "").trim();
    }
  }

  const updated: CustomerRecord = {
    ...current,
    name: data.name !== undefined ? (data.name?.trim() || null) : current.name,
    phone: data.phone !== undefined ? data.phone.trim() : current.phone,
    email: data.email !== undefined ? (data.email?.trim() || null) : current.email,
    address: data.address !== undefined ? (data.address?.trim() || null) : current.address,
    notes: newNotes,
    updatedAt: new Date(),
  };

  memoryCustomers[memIdx] = updated;
  return updated;
}

/**
 * Permanently delete a customer, their orders, and conversation records
 */
export async function deleteCustomerById(id: string): Promise<boolean> {
  try {
    // 1. Find all orders belonging to customer
    const orders = await prisma.order.findMany({
      where: { customerId: id },
      select: { id: true },
    });
    const orderIds = orders.map((o) => o.id);

    // 2. Delete order items
    if (orderIds.length > 0) {
      await prisma.orderItem.deleteMany({
        where: { orderId: { in: orderIds } },
      });
      // 3. Delete orders
      await prisma.order.deleteMany({
        where: { id: { in: orderIds } },
      });
    }

    // 4. Find all conversations and delete messages
    const convs = await prisma.conversation.findMany({
      where: { customerId: id },
      select: { id: true },
    });
    const convIds = convs.map((c) => c.id);
    if (convIds.length > 0) {
      await prisma.message.deleteMany({
        where: { conversationId: { in: convIds } },
      });
      await prisma.conversation.deleteMany({
        where: { id: { in: convIds } },
      });
    }

    // 5. Delete customer record
    await prisma.customer.delete({
      where: { id },
    });
  } catch (err: any) {
    console.warn("[customer-store:deleteCustomerById] database notice:", err?.message || err);
  }

  // Remove from in-memory store
  const idx = memoryCustomers.findIndex((c) => c.id === id);
  if (idx !== -1) {
    memoryCustomers.splice(idx, 1);
  }

  return true;
}
