import { NextRequest } from "next/server";
import { getSession, isOwner } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { COMPLETE_CATEGORIES_DATA, COMPLETE_ITEMS_DATA } from "@/lib/menu-store";
import { logAuditEvent } from "@/lib/auth";
import { clientIp } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  const isOwnerUser =
    isOwner(session) ||
    session?.role === "OWNER" ||
    (session?.role as string)?.toUpperCase() === "ADMIN_OWNER" ||
    (session?.role as string)?.toLowerCase() === "owner";

  if (!session || !isOwnerUser) {
    return Response.json(
      { ok: false, error: "Unauthorized. Only Owner can force sync the menu catalog." },
      { status: 403 }
    );
  }

  try {
    await prisma.menuItem.deleteMany().catch(() => {});
    await prisma.menuCategory.deleteMany().catch(() => {});

    for (const cat of COMPLETE_CATEGORIES_DATA) {
      await prisma.menuCategory.create({
        data: {
          id: cat.id,
          name: cat.name,
          urduName: cat.urduName,
          description: cat.description,
          displayOrder: cat.displayOrder,
          isActive: true,
        },
      });
    }

    for (const item of COMPLETE_ITEMS_DATA) {
      await prisma.menuItem.create({
        data: {
          id: item.id,
          categoryId: item.categoryId,
          name: item.name,
          price: item.price,
          description: item.description,
          displayOrder: item.displayOrder,
          isAvailable: true,
          isFeatured: item.displayOrder === 1,
          preparationTime: 15,
        },
      });
    }

    if (redis) {
      try {
        const keys = await redis.keys("*menu*");
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (err: any) {
        console.warn("[menu:sync] redis flush notice:", err?.message);
      }
    }

    const ip = clientIp(req);
    await logAuditEvent({
      actorId: session.sub,
      actorEmail: session.email || "owner",
      action: "MENU_FORCE_OVERWRITTEN",
      target: "MENU_CATALOG",
      details: {
        categoryCount: COMPLETE_CATEGORIES_DATA.length,
        itemCount: COMPLETE_ITEMS_DATA.length,
        triggeredBy: session.name,
      },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({
      ok: true,
      message: "Database menu successfully synced with 100% complete A-ONE Foods catalog.",
      categories: COMPLETE_CATEGORIES_DATA.length,
      items: COMPLETE_ITEMS_DATA.length,
    });
  } catch (error: any) {
    console.error("[menu sync POST] error:", error);
    return Response.json(
      { ok: false, error: error?.message || "Failed to sync menu." },
      { status: 500 }
    );
  }
}
