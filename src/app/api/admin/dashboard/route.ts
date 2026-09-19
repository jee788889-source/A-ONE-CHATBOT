import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { canAccessAdmin, isManagerOrOwner } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  DEFAULT_BUSINESS_HOURS,
  evaluateBusinessHours,
  type TemporaryClosure,
} from "@/lib/business-hours";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!canAccessAdmin(session)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const canSeeRevenue = isManagerOrOwner(session);

    // Batch 1: Settings, Conversations, Customers
    const [settings, activeConversationsCount, totalCustomersCount] = await Promise.all([
      prisma.restaurantSettings.findUnique({ where: { id: "default" } }).catch(() => null),
      prisma.conversation.count({ where: { status: { in: ["OPEN", "PENDING"] } } }).catch(() => 0),
      prisma.customer.count().catch(() => 0),
    ]);

    // Batch 2: Order summaries & Popular Items
    const [recentOrders, orderStatusGroup, popularItems] = await Promise.all([
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          assignedStaff: { select: { id: true, name: true } },
        },
      }).catch(() => []),
      prisma.order.groupBy({
        by: ["status"],
        _count: { status: true },
      }).catch(() => []),
      prisma.orderItem.groupBy({
        by: ["itemName"],
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }).catch(() => []),
    ]);

    // Batch 3: Today's Orders & Revenue Aggregations
    const [todayOrdersCount, pendingVerificationsCount, rejectedPaymentsCount, todayTotalRevenueAgg, todayCodRevenueAgg, todayOnlineRevenueAgg] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }).catch(() => 0),
      prisma.order.count({ where: { paymentStatus: "PENDING_VERIFICATION" } }).catch(() => 0),
      prisma.order.count({ where: { paymentStatus: "REJECTED" } }).catch(() => 0),
      canSeeRevenue
        ? prisma.order.aggregate({
            _sum: { total: true },
            where: {
              status: { not: "CANCELLED" },
              createdAt: { gte: todayStart },
            },
          }).catch(() => ({ _sum: { total: 0 } }))
        : Promise.resolve({ _sum: { total: 0 } }),
      canSeeRevenue
        ? prisma.order.aggregate({
            _sum: { total: true },
            where: {
              status: { not: "CANCELLED" },
              paymentStatus: "CASH_ON_DELIVERY",
              createdAt: { gte: todayStart },
            },
          }).catch(() => ({ _sum: { total: 0 } }))
        : Promise.resolve({ _sum: { total: 0 } }),
      canSeeRevenue
        ? prisma.order.aggregate({
            _sum: { total: true },
            where: {
              status: { not: "CANCELLED" },
              paymentStatus: "PAID",
              createdAt: { gte: todayStart },
            },
          }).catch(() => ({ _sum: { total: 0 } }))
        : Promise.resolve({ _sum: { total: 0 } }),
    ]);

    // Derive status breakdowns from orderStatusGroup in memory
    let pendingOrdersCount = 0;
    let completedOrdersCount = 0;
    let cancelledOrdersCount = 0;

    for (const g of orderStatusGroup) {
      const s = g.status;
      const count = g._count?.status || 0;
      if (["NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(s)) {
        pendingOrdersCount += count;
      } else if (s === "COMPLETED") {
        completedOrdersCount += count;
      } else if (s === "CANCELLED") {
        cancelledOrdersCount += count;
      }
    }

    // Customer not received count
    const customerNotReceivedCount = await prisma.order.count({
      where: {
        status: "CANCELLED",
        OR: [
          { cancelledReason: { contains: "not receive", mode: "insensitive" } },
          { cancelledReason: { contains: "refused", mode: "insensitive" } },
        ],
      },
    }).catch(() => 0);

    const openingHoursObj = (settings?.openingHours as any) || DEFAULT_BUSINESS_HOURS;
    const tempClosure: TemporaryClosure = openingHoursObj.temporaryClosure || {
      isClosed: !(settings?.isAcceptingOrders ?? true),
      reason: "Maintenance",
    };

    const liveBusinessHours = evaluateBusinessHours(openingHoursObj, tempClosure);

    return Response.json({
      ok: true,
      stats: {
        todayOrders: todayOrdersCount,
        pendingOrders: pendingOrdersCount,
        completedOrders: completedOrdersCount,
        cancelledOrders: cancelledOrdersCount,
        customerNotReceived: customerNotReceivedCount,
        activeConversations: activeConversationsCount,
        totalCustomers: totalCustomersCount,
        todayRevenue: canSeeRevenue ? (todayTotalRevenueAgg._sum?.total ?? 0) : null,
        todayCodRevenue: canSeeRevenue ? (todayCodRevenueAgg._sum?.total ?? 0) : null,
        todayOnlineRevenue: canSeeRevenue ? (todayOnlineRevenueAgg._sum?.total ?? 0) : null,
        pendingVerifications: pendingVerificationsCount,
        rejectedPayments: rejectedPaymentsCount,
      },
      liveBusinessHours,
      recentOrders,
      orderStatusDistribution: orderStatusGroup.map((g) => ({
        status: g.status,
        count: g._count?.status || 0,
      })),
      popularItems: popularItems.map((item) => ({
        name: item.itemName,
        quantity: item._sum?.quantity || 0,
        sales: canSeeRevenue ? (item._sum?.subtotal ?? 0) : null,
      })),
    });
  } catch (error) {
    console.error("[dashboard] error:", error);
    return Response.json(
      { ok: false, error: "Failed to load dashboard data." },
      { status: 500 }
    );
  }
}
