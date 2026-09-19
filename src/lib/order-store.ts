import { prisma } from "@/lib/db";
import type { OrderStatus, OrderType, PaymentStatus } from "@prisma/client";

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerId: string;
  conversationId?: string | null;
  status: OrderStatus;
  orderType: OrderType;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string | null;
  notes?: string | null;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  paymentScreenshot?: string | null;
  paymentVerifiedBy?: string | null;
  paymentVerifiedAt?: Date | null;
  paymentNotes?: string | null;
  assignedStaffId?: string | null;
  estimatedDeliveryAt?: Date | null;
  deliveredAt?: Date | null;
  cancelledReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: any[];
  assignedStaff?: { id: string; name: string; email?: string } | null;
  customer?: { id: string; name: string | null; phone: string; address: string | null } | null;
}

const memoryOrders: OrderRecord[] = [
  {
    id: "ord-1001",
    orderNumber: "AONE-1025",
    customerId: "cust-1",
    status: "NEW",
    orderType: "DELIVERY",
    paymentStatus: "PENDING_VERIFICATION",
    subtotal: 1700,
    deliveryFee: 150,
    discount: 0,
    total: 1850,
    customerName: "Muhammad Usman",
    customerPhone: "+92 300 1234567",
    deliveryAddress: "House 42-B, Street 5, Phase 5 DHA, Lahore",
    notes: "Please pack spoons and extra ketchup packets.",
    paymentMethod: "JAZZCASH",
    paymentReference: "JC-99281742",
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      { id: "oi-1", orderId: "ord-1001", itemName: "A-ONE Special Beef Smash Burger", unitPrice: 850, quantity: 2, subtotal: 1700 },
    ],
    assignedStaff: null,
    customer: { id: "cust-1", name: "Muhammad Usman", phone: "+92 300 1234567", address: "House 42-B, Street 5, Phase 5 DHA, Lahore" },
  },
  {
    id: "ord-1002",
    orderNumber: "AONE-1024",
    customerId: "cust-2",
    status: "CONFIRMED",
    orderType: "DELIVERY",
    paymentStatus: "CASH_ON_DELIVERY",
    subtotal: 1300,
    deliveryFee: 150,
    discount: 50,
    total: 1400,
    customerName: "Ayesha Khan",
    customerPhone: "+92 321 9876543",
    deliveryAddress: "Flat 304, Gulberg Heights, Main Boulevard, Lahore",
    notes: "Call when downstairs.",
    paymentMethod: "CASH_ON_DELIVERY",
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(),
    items: [
      { id: "oi-2", orderId: "ord-1002", itemName: "Crispy Zinger Crunch Burger", unitPrice: 650, quantity: 2, subtotal: 1300 },
    ],
    assignedStaff: { id: "staff-1", name: "Admin Staff", email: "staff@aone.com" },
    customer: { id: "cust-2", name: "Ayesha Khan", phone: "+92 321 9876543", address: "Flat 304, Gulberg Heights, Main Boulevard, Lahore" },
  },
  {
    id: "ord-1003",
    orderNumber: "AONE-1023",
    customerId: "cust-3",
    status: "PREPARING",
    orderType: "DELIVERY",
    paymentStatus: "PAID",
    subtotal: 1040,
    deliveryFee: 150,
    discount: 0,
    total: 1190,
    customerName: "Hamza Tariq",
    customerPhone: "+92 333 5551212",
    deliveryAddress: "Plot 18, Block G, Model Town, Lahore",
    notes: "Spicy biryani with fresh salad.",
    paymentMethod: "EASYPAISA",
    paymentReference: "EP-8837190",
    paymentVerifiedBy: "Owner",
    paymentVerifiedAt: new Date(Date.now() - 7200000),
    createdAt: new Date(Date.now() - 7200000),
    updatedAt: new Date(),
    items: [
      { id: "oi-3", orderId: "ord-1003", itemName: "A-ONE Special Chicken Dum Biryani", unitPrice: 520, quantity: 2, subtotal: 1040 },
    ],
    assignedStaff: { id: "staff-1", name: "Admin Staff", email: "staff@aone.com" },
    customer: { id: "cust-3", name: "Hamza Tariq", phone: "+92 333 5551212", address: "Plot 18, Block G, Model Town, Lahore" },
  },
];

export async function fetchOrders(params: {
  status?: string | null;
  paymentStatus?: string | null;
  search?: string | null;
  limit?: number;
  page?: number;
}) {
  const limit = Math.min(params.limit || 50, 100);
  const page = Math.max(params.page || 1, 1);
  const skip = (page - 1) * limit;

  try {
    const where: any = {};
    if (params.status) {
      if (params.status === "PENDING_VERIFICATION") {
        where.paymentStatus = "PENDING_VERIFICATION";
      } else {
        where.status = params.status;
      }
    }
    if (params.paymentStatus) {
      where.paymentStatus = params.paymentStatus;
    }
    if (params.search?.trim()) {
      const s = params.search.trim();
      where.OR = [
        { orderNumber: { contains: s, mode: "insensitive" } },
        { customerName: { contains: s, mode: "insensitive" } },
        { customerPhone: { contains: s, mode: "insensitive" } },
        { deliveryAddress: { contains: s, mode: "insensitive" } },
        { paymentReference: { contains: s, mode: "insensitive" } },
      ];
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          assignedStaff: { select: { id: true, name: true, email: true } },
          customer: { select: { id: true, name: true, phone: true, address: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    if (orders && orders.length > 0) {
      return {
        orders: orders as OrderRecord[],
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      };
    }
  } catch (err: any) {
    console.warn("[order-store:fetchOrders] database fallback:", err?.message || err);
  }

  // Memory fallback filtering
  let filtered = [...memoryOrders];
  if (params.status) {
    if (params.status === "PENDING_VERIFICATION") {
      filtered = filtered.filter((o) => o.paymentStatus === "PENDING_VERIFICATION");
    } else {
      filtered = filtered.filter((o) => o.status === params.status);
    }
  }
  if (params.paymentStatus) {
    filtered = filtered.filter((o) => o.paymentStatus === params.paymentStatus);
  }
  if (params.search?.trim()) {
    const s = params.search.trim().toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(s) ||
        o.customerName.toLowerCase().includes(s) ||
        o.customerPhone.toLowerCase().includes(s) ||
        (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(s)) ||
        (o.paymentReference && o.paymentReference.toLowerCase().includes(s))
    );
  }

  const totalCount = filtered.length;
  const paginated = filtered.slice(skip, skip + limit);

  return {
    orders: paginated,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  };
}

export async function fetchOrderById(id: string): Promise<OrderRecord | null> {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        assignedStaff: { select: { id: true, name: true, email: true } },
        customer: true,
      },
    });

    if (order) return order as OrderRecord;
  } catch (err: any) {
    console.warn("[order-store:fetchOrderById] database fallback:", err?.message || err);
  }

  const found = memoryOrders.find((o) => o.id === id || o.orderNumber === id);
  return found || null;
}
