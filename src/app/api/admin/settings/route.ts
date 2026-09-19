import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { isManagerOrOwner, isOwner, logAuditEvent } from "@/lib/auth";
import { clientIp } from "@/lib/api";
import { getRestaurantSettings, updateRestaurantSettings } from "@/lib/settings-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!isManagerOrOwner(session)) {
    return Response.json({ ok: false, error: "Unauthorized access to system settings." }, { status: 403 });
  }

  try {
    const { settings, liveStatus } = await getRestaurantSettings();

    return Response.json({
      ok: true,
      settings,
      liveStatus,
      isOwner: isOwner(session),
    });
  } catch (error: any) {
    console.error("[settings GET] error:", error);
    return Response.json({ ok: false, error: error?.message || "Failed to fetch settings." }, { status: 500 });
  }
}

const updateSettingsSchema = z.object({
  name: z.string().optional(),
  tagline: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
  deliveryFee: z.number().optional(),
  minOrderAmount: z.number().optional(),
  isAcceptingOrders: z.boolean().optional(),
  openingHours: z.record(z.any()).optional(),
  deliverySettings: z.record(z.any()).optional(),
  paymentAccounts: z.record(z.any()).optional(),
  whatsappConfig: z.record(z.any()).optional(),
  aiSettings: z.record(z.any()).optional(),
  temporaryClosure: z
    .object({
      isClosed: z.boolean(),
      reason: z.string().optional(),
      closedUntil: z.string().optional(),
    })
    .optional(),
});

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!isManagerOrOwner(session)) {
    return Response.json({ ok: false, error: "Only the Owner and Manager can update system settings." }, { status: 403 });
  }

  const parsed = updateSettingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Invalid settings data.", details: parsed.error.format() }, { status: 400 });
  }

  const data = parsed.data;
  const ip = clientIp(req);

  try {
    const { settings, liveStatus } = await updateRestaurantSettings(data as any);

    await logAuditEvent({
      actorId: session?.sub,
      actorEmail: session?.email || "staff",
      action: "SETTINGS_UPDATED",
      target: "RESTAURANT_SETTINGS",
      details: {
        updatedFields: Object.keys(data),
        temporaryClosure: data.temporaryClosure,
      },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({ ok: true, settings, liveStatus });
  } catch (error: any) {
    console.error("[settings PUT] error:", error);
    return Response.json({ ok: false, error: error?.message || "Failed to update settings." }, { status: 500 });
  }
}
