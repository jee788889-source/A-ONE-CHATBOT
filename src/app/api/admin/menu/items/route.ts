import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { canAccessAdmin, hasPermission, logAuditEvent } from "@/lib/auth";
import { clientIp } from "@/lib/api";
import {
  fetchAllMenuItems,
  createMenuItem,
  updateMenuItem,
  updateMenuItemAvailability,
  deleteMenuItem,
} from "@/lib/menu-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!canAccessAdmin(session)) {
    return Response.json({ ok: false, error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const categoryId = searchParams.get("categoryId") || undefined;
  const search = searchParams.get("search")?.trim() || undefined;

  try {
    const items = await fetchAllMenuItems(categoryId, search);
    return Response.json({ ok: true, items });
  } catch (error: any) {
    console.error("[menu items GET] error:", error);
    return Response.json(
      { ok: false, error: error.message || "Failed to fetch items." },
      { status: 500 }
    );
  }
}

const itemSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Item name is required"),
  urduName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.number().positive("Price must be greater than 0"),
  imageUrl: z.string().optional().nullable(),
  isAvailable: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  displayOrder: z.number().int().optional().default(0),
  preparationTime: z.number().int().optional().default(15),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!canAccessAdmin(session) || !hasPermission(session, "manage_menu")) {
    return Response.json({ ok: false, error: "Unauthorized to manage menu items." }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = itemSchema.safeParse(json);
  if (!parsed.success) {
    const firstErr = parsed.error.issues[0]?.message || "Invalid item data.";
    return Response.json({ ok: false, error: firstErr }, { status: 400 });
  }

  const data = parsed.data;
  const ip = clientIp(req);

  try {
    const item = await createMenuItem({
      categoryId: data.categoryId,
      name: data.name,
      urduName: data.urduName,
      description: data.description,
      price: data.price,
      imageUrl: data.imageUrl,
      isAvailable: data.isAvailable,
      isFeatured: data.isFeatured,
      displayOrder: data.displayOrder,
      preparationTime: data.preparationTime,
    });

    await logAuditEvent({
      actorId: session?.sub,
      actorEmail: session?.email || "staff",
      action: "MENU_ITEM_CREATED",
      target: item.name,
      details: { itemId: item.id, price: item.price, categoryId: item.categoryId },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({ ok: true, item }, { status: 201 });
  } catch (error: any) {
    console.error("[menu item POST] error:", error);
    return Response.json(
      { ok: false, error: error.message || "Failed to create menu item in database." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!canAccessAdmin(session) || !hasPermission(session, "manage_menu")) {
    return Response.json({ ok: false, error: "Unauthorized to manage menu items." }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = itemSchema.safeParse(json);
  if (!parsed.success || !parsed.data.id) {
    return Response.json({ ok: false, error: "Valid item ID and data are required." }, { status: 400 });
  }

  const { id, ...data } = parsed.data;
  const ip = clientIp(req);

  try {
    const item = await updateMenuItem(id, data);

    await logAuditEvent({
      actorId: session?.sub,
      actorEmail: session?.email || "staff",
      action: "MENU_ITEM_UPDATED",
      target: item.name,
      details: { itemId: item.id, price: item.price, isAvailable: item.isAvailable, categoryId: item.categoryId },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({ ok: true, item });
  } catch (error: any) {
    console.error("[menu item PUT] error:", error);
    return Response.json(
      { ok: false, error: error.message || "Failed to update menu item." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!canAccessAdmin(session) || !hasPermission(session, "manage_menu")) {
    return Response.json({ ok: false, error: "Unauthorized to manage menu items." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.id || typeof body.isAvailable !== "boolean") {
    return Response.json({ ok: false, error: "ID and isAvailable boolean are required" }, { status: 400 });
  }

  const ip = clientIp(req);

  try {
    const item = await updateMenuItemAvailability(body.id, body.isAvailable);

    await logAuditEvent({
      actorId: session?.sub,
      actorEmail: session?.email || "staff",
      action: "MENU_ITEM_AVAILABILITY_CHANGED",
      target: item.name,
      details: { itemId: item.id, isAvailable: item.isAvailable },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({ ok: true, item });
  } catch (error: any) {
    console.error("[menu item PATCH] error:", error);
    return Response.json(
      { ok: false, error: error.message || "Failed to update item availability." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!canAccessAdmin(session) || !hasPermission(session, "manage_menu")) {
    return Response.json({ ok: false, error: "Unauthorized to manage menu items." }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ ok: false, error: "Item ID is required" }, { status: 400 });
  }

  const ip = clientIp(req);

  try {
    const res = await deleteMenuItem(id);

    await logAuditEvent({
      actorId: session?.sub,
      actorEmail: session?.email || "staff",
      action: "MENU_ITEM_DELETED",
      target: res.deletedName,
      details: { itemId: id },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({ ok: true, deletedName: res.deletedName });
  } catch (error: any) {
    console.error("[menu item DELETE] error:", error);
    return Response.json(
      { ok: false, error: error.message || "Failed to delete menu item." },
      { status: 500 }
    );
  }
}
