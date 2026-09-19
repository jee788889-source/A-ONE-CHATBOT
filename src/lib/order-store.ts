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

// Clean in-memory orders store initialized with ZERO demo records
const memoryOrders: OrderRecord[] = [];

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

    if (orders) {
      return {
        orders: orders as OrderRecord[],
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      };
    }
  } catch (err: any) {
    console.warn("[order-store:fetchOrders] database notice:", err?.message || err);
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
    totalPages: Math.ceil(totalCount / limit) || 1,
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
    console.warn("[order-store:fetchOrderById] database notice:", err?.message || err);
  }

  const found = memoryOrders.find((o) => o.id === id || o.orderNumber === id);
  return found || null;
}
