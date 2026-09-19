import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { canAccessAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!canAccessAdmin(session)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search")?.trim();

  try {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
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

    return Response.json({ ok: true, customers });
  } catch (error) {
    console.error("[customers GET] error:", error);
    return Response.json({ ok: false, error: "Failed to fetch customers." }, { status: 500 });
  }
}
