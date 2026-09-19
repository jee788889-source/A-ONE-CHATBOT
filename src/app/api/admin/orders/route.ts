import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { canAccessAdmin, logAuditEvent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientIp } from "@/lib/api";
import type { OrderStatus, OrderType, PaymentStatus } from "@prisma/client";

import { fetchOrders } from "@/lib/order-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!canAccessAdmin(session)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") || undefined;
  const paymentStatus = searchParams.get("paymentStatus") || undefined;
  const search = searchParams.get("search")?.trim() || undefined;
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);
  const page = Math.max(Number(searchParams.get("page") || 1), 1);

  try {
    const result = await fetchOrders({ status, paymentStatus, search, limit, page });
    return Response.json({
      ok: true,
      orders: result.orders,
      pagination: {
        total: result.totalCount,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    console.error("[orders GET] error:", error);
    return Response.json({ ok: false, error: error?.message || "Failed to fetch orders." }, { status: 500 });
  }
}

const createOrderSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  deliveryAddress: z.string().optional(),
  orderType: z.enum(["DELIVERY", "PICKUP", "DINE_IN"]).default("DELIVERY"),
  paymentStatus: z.enum(["PENDING", "PAID", "CASH_ON_DELIVERY", "FAILED"]).default("CASH_ON_DELIVERY"),
  deliveryFee: z.number().default(0),
  discount: z.number().default(0),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      menuItemId: z.string().optional(),
      itemName: z.string().min(1),
      unitPrice: z.number().positive(),
      quantity: z.number().int().positive(),
      notes: z.string().optional(),
    })
  ).min(1),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!canAccessAdmin(session)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createOrderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid order data", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const ip = clientIp(req);

  try {
    // 1. Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const total = subtotal + data.deliveryFee - data.discount;

    // 2. Find or create customer
    const phone = data.customerPhone.trim();
    const customer = await prisma.customer.upsert({
      where: { phone },
      update: {
        name: data.customerName,
        address: data.deliveryAddress || undefined,
        totalOrders: { increment: 1 },
        totalSpent: { increment: total },
      },
      create: {
        phone,
        name: data.customerName,
        address: data.deliveryAddress,
        totalOrders: 1,
        totalSpent: total,
      },
    });

    // 3. Generate sequential order number
    const count = await prisma.order.count();
    const orderNumber = `AONE-${1000 + count + 1}`;

    // 4. Create Order and items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        status: "NEW",
        orderType: data.orderType as OrderType,
        paymentStatus: data.paymentStatus as PaymentStatus,
        subtotal,
        deliveryFee: data.deliveryFee,
        discount: data.discount,
        total,
        customerName: data.customerName,
        customerPhone: phone,
        deliveryAddress: data.deliveryAddress,
        notes: data.notes,
        assignedStaffId: session?.sub,
        items: {
          create: data.items.map((item) => ({
            menuItemId: item.menuItemId,
            itemName: item.itemName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.unitPrice * item.quantity,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 5. Audit log
    await logAuditEvent({
      actorId: session?.sub,
      actorEmail: session?.email || "staff",
      action: "ORDER_CREATED",
      target: order.orderNumber,
      details: { orderId: order.id, total, itemsCount: data.items.length },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({ ok: true, order }, { status: 201 });
  } catch (error) {
    console.error("[orders POST] error:", error);
    return Response.json({ ok: false, error: "Failed to create order." }, { status: 500 });
  }
}
