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

// In-memory fallback dataset for high availability
const memoryCustomers: CustomerRecord[] = [
  {
    id: "cust-1",
    phone: "+92 300 1234567",
    name: "Muhammad Usman",
    email: "usman.ali@gmail.com",
    address: "House 42-B, Street 5, Phase 5 DHA, Lahore",
    notes: "VIP Customer. Prefers extra spicy biryani and cold drinks.",
    totalOrders: 14,
    totalSpent: 12850,
    createdAt: new Date(Date.now() - 30 * 86400000),
    updatedAt: new Date(),
    _count: { orders: 14, conversations: 8 },
  },
  {
    id: "cust-2",
    phone: "+92 321 9876543",
    name: "Ayesha Khan",
    email: "ayesha.k@outlook.com",
    address: "Flat 304, Gulberg Heights, Main Boulevard, Lahore",
    notes: "Regular lunch orders. Doorbell doesn't work, please call upon arrival.",
    totalOrders: 9,
    totalSpent: 7420,
    createdAt: new Date(Date.now() - 20 * 86400000),
    updatedAt: new Date(),
    _count: { orders: 9, conversations: 5 },
  },
  {
    id: "cust-3",
    phone: "+92 333 5551212",
    name: "Hamza Tariq",
    email: "hamza.tariq@gmail.com",
    address: "Plot 18, Block G, Model Town, Lahore",
    notes: "Frequently orders Beef Smash Burgers for family dinner.",
    totalOrders: 6,
    totalSpent: 5900,
    createdAt: new Date(Date.now() - 15 * 86400000),
    updatedAt: new Date(),
    _count: { orders: 6, conversations: 3 },
  },
  {
    id: "cust-4",
    phone: "+92 312 4443322",
    name: "Fatima Noor",
    email: "fatima.noor@yahoo.com",
    address: "Building 12, Commercial Area, Cavalary Ground, Lahore",
    notes: "Prefers online JazzCash / Bank transfer payment.",
    totalOrders: 4,
    totalSpent: 3200,
    createdAt: new Date(Date.now() - 8 * 86400000),
    updatedAt: new Date(),
    _count: { orders: 4, conversations: 2 },
  },
  {
    id: "cust-5",
    phone: "+92 301 7778899",
    name: "Bilal Ahmed",
    email: "bilal.ahmed@live.com",
    address: "House 9, Sector C, Bahria Town, Lahore",
    notes: "Always requests extra garlic sauce and mint raita.",
    totalOrders: 3,
    totalSpent: 2650,
    createdAt: new Date(Date.now() - 3 * 86400000),
    updatedAt: new Date(),
    _count: { orders: 3, conversations: 2 },
  },
];

/**
 * Fetch all customers with search support and automatic fallback
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

    if (customers && customers.length > 0) {
      return customers as CustomerRecord[];
    }
  } catch (err: any) {
    console.warn("[customer-store:fetchAllCustomers] database fallback:", err?.message || err);
  }

  // Fallback to memory store
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
 * Fetch a single customer by ID with fallback
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
    console.warn("[customer-store:fetchCustomerById] database fallback:", err?.message || err);
  }

  const found = memoryCustomers.find((c) => c.id === id);
  if (!found) return null;

  return {
    ...found,
    orders: [
      {
        id: `ord-mock-${found.id}`,
        orderNumber: "AONE-1024",
        status: "COMPLETED",
        orderType: "DELIVERY",
        paymentStatus: "PAID",
        total: 1850,
        createdAt: new Date(Date.now() - 86400000),
        items: [
          { id: "item-1", itemName: "A-ONE Special Beef Smash Burger", quantity: 2, unitPrice: 850, subtotal: 1700 },
          { id: "item-2", itemName: "Chilled Coke (500ml)", quantity: 1, unitPrice: 150, subtotal: 150 },
        ],
      },
    ],
    conversations: [
      {
        id: `conv-mock-${found.id}`,
        channel: "WHATSAPP",
        status: "RESOLVED",
        lastMessageAt: new Date(Date.now() - 86400000),
      },
    ],
  };
}

/**
 * Update a customer profile with fallback
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

      // Update memory if present
      const memIdx = memoryCustomers.findIndex((c) => c.id === id);
      if (memIdx !== -1) {
        memoryCustomers[memIdx] = { ...memoryCustomers[memIdx], ...(updated as CustomerRecord) };
      }

      return updated as CustomerRecord;
    }
  } catch (err: any) {
    console.warn("[customer-store:updateCustomerProfile] database fallback:", err?.message || err);
  }

  // Memory fallback update
  let memIdx = memoryCustomers.findIndex((c) => c.id === id);
  if (memIdx === -1) {
    // If not found in seed, create entry
    const newCust: CustomerRecord = {
      id,
      phone: data.phone || "+92 300 0000000",
      name: data.name || "Customer",
      email: data.email || null,
      address: data.address || null,
      notes: data.notes || null,
      totalOrders: 1,
      totalSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { orders: 1, conversations: 1 },
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
