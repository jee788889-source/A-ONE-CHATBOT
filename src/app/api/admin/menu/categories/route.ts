import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { canAccessAdmin, hasPermission, logAuditEvent } from "@/lib/auth";
import { clientIp } from "@/lib/api";
import {
  fetchAllCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
} from "@/lib/menu-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!canAccessAdmin(session)) {
    return Response.json({ ok: false, error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  try {
    const categories = await fetchAllCategories();
    return Response.json({ ok: true, categories });
  } catch (error: any) {
    console.error("[menu categories GET] error:", error);
    return Response.json(
      { ok: false, error: error.message || "Failed to fetch categories." },
      { status: 500 }
    );
  }
}

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Category name is required"),
  urduName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  displayOrder: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!canAccessAdmin(session) || !hasPermission(session, "manage_menu")) {
    return Response.json({ ok: false, error: "Unauthorized to manage menu categories." }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = categorySchema.safeParse(json);
  if (!parsed.success) {
    const firstErr = parsed.error.issues[0]?.message || "Invalid category data.";
    return Response.json({ ok: false, error: firstErr }, { status: 400 });
  }

  const data = parsed.data;
  const ip = clientIp(req);

  try {
    const category = await createMenuCategory({
      name: data.name,
      urduName: data.urduName,
      description: data.description,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
    });

    await logAuditEvent({
      actorId: session?.sub,
      actorEmail: session?.email || "staff",
      action: "MENU_CATEGORY_CREATED",
      target: category.name,
      details: { categoryId: category.id },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({ ok: true, category }, { status: 201 });
  } catch (error: any) {
    console.error("[menu category POST] error:", error);
    return Response.json(
      { ok: false, error: error.message || "Failed to create category in database." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!canAccessAdmin(session) || !hasPermission(session, "manage_menu")) {
    return Response.json({ ok: false, error: "Unauthorized to manage menu categories." }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = categorySchema.safeParse(json);
  if (!parsed.success || !parsed.data.id) {
    return Response.json({ ok: false, error: "Valid category ID and data are required." }, { status: 400 });
  }

  const { id, ...data } = parsed.data;
  const ip = clientIp(req);

  try {
    const category = await updateMenuCategory(id, data);

    await logAuditEvent({
      actorId: session?.sub,
      actorEmail: session?.email || "staff",
      action: "MENU_CATEGORY_UPDATED",
      target: category.name,
      details: { categoryId: category.id, data },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({ ok: true, category });
  } catch (error: any) {
    console.error("[menu category PUT] error:", error);
    return Response.json(
      { ok: false, error: error.message || "Failed to update category." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!canAccessAdmin(session) || !hasPermission(session, "manage_menu")) {
    return Response.json({ ok: false, error: "Unauthorized to manage menu categories." }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ ok: false, error: "Category ID is required" }, { status: 400 });
  }

  const ip = clientIp(req);

  try {
    const res = await deleteMenuCategory(id);

    await logAuditEvent({
      actorId: session?.sub,
      actorEmail: session?.email || "staff",
      action: "MENU_CATEGORY_DELETED",
      target: res.deletedName,
      details: { categoryId: id },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({ ok: true, deletedName: res.deletedName });
  } catch (error: any) {
    console.error("[menu category DELETE] error:", error);
    return Response.json(
      { ok: false, error: error.message || "Failed to delete category." },
      { status: 500 }
    );
  }
}
