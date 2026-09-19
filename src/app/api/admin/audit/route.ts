import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { isOwner } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!isOwner(session)) {
    return Response.json({ ok: false, error: "Only the Owner can access system audit logs." }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search")?.trim();
  const action = searchParams.get("action");
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);
  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const skip = (page - 1) * limit;

  try {
    const where: any = {};
    if (action) {
      where.action = action;
    }
    if (search) {
      where.OR = [
        { actorEmail: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        { target: { contains: search, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          actor: { select: { id: true, name: true, role: true } },
        },
      }).catch(() => []),
      prisma.auditLog.count({ where }).catch(() => 0),
    ]);

    return Response.json({
      ok: true,
      logs: logs || [],
      pagination: {
        total: total || 0,
        page,
        limit,
        totalPages: Math.ceil((total || 0) / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("[audit logs GET] error:", error);
    return Response.json({
      ok: true,
      logs: [],
      pagination: { total: 0, page: 1, limit: 50, totalPages: 1 },
    });
  }
}
