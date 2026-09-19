import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { isManagerOrOwner, isOwner, logAuditEvent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientIp } from "@/lib/api";
import {
  DEFAULT_BUSINESS_HOURS,
  evaluateBusinessHours,
  type TemporaryClosure,
} from "@/lib/business-hours";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!isManagerOrOwner(session)) {
    return Response.json({ ok: false, error: "Unauthorized access to system settings." }, { status: 403 });
  }

  try {
    let settings = await prisma.restaurantSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.restaurantSettings.create({
        data: {
          id: "default",
          name: "A-ONE Restaurant",
          tagline: "Authentic Taste, Premium Quality & Traditional Savories",
          phone: "+92 300 1234567",
          email: "contact@aonefoods.com",
          address: "A-ONE Restaurant, Main Boulevard, Pakistan",
          currency: "PKR",
          currencySymbol: "Rs.",
          deliveryFee: 150,
          minOrderAmount: 500,
          isAcceptingOrders: true,
          openingHours: DEFAULT_BUSINESS_HOURS as any,
          deliverySettings: {
            standardDeliveryFee: 150,
            freeDeliveryThreshold: 2000,
            estimatedMinutes: 35,
            allowedAreas: ["City Center", "Commercial Area", "Model Town", "Gulberg", "DHA"],
          },
          whatsappConfig: {
            welcomeMessage:
              "Welcome to A-ONE Restaurant! 🍔🍕\nHow may we serve you today?\n\nType *Menu* to see our dishes or *Order* to start an order.",
            autoReplyEnabled: true,
            fallbackMessage:
              "Thank you for contacting A-ONE Restaurant. One of our team members will assist you.",
          },
          aiSettings: {
            provider: "anthropic",
            model: "claude-3-5-sonnet-20241022",
            temperature: 0.2,
            maxTokens: 600,
            strictGuardrails: true,
          },
        },
      });
    }

    const openingHoursObj = (settings.openingHours as any) || DEFAULT_BUSINESS_HOURS;
    const tempClosure: TemporaryClosure = openingHoursObj.temporaryClosure || {
      isClosed: !settings.isAcceptingOrders,
      reason: "Maintenance",
    };

    const liveStatus = evaluateBusinessHours(openingHoursObj, tempClosure);

    return Response.json({
      ok: true,
      settings,
      liveStatus,
      isOwner: isOwner(session),
    });
  } catch (error) {
    console.error("[settings GET] error:", error);
    return Response.json({ ok: false, error: "Failed to fetch settings." }, { status: 500 });
  }
}

const updateSettingsSchema = z.object({
  name: z.string().optional(),
  tagline: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
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
    const existing = await prisma.restaurantSettings.findUnique({ where: { id: "default" } });
    const currentOpeningHours = (existing?.openingHours as any) || DEFAULT_BUSINESS_HOURS;

    const mergedOpeningHours = {
      ...(data.openingHours || currentOpeningHours),
      ...(data.temporaryClosure ? { temporaryClosure: data.temporaryClosure } : {}),
    };

    const updatePayload: any = {
      ...data,
      openingHours: mergedOpeningHours,
    };

    // If temporary closure is specified, keep isAcceptingOrders in sync
    if (data.temporaryClosure !== undefined) {
      updatePayload.isAcceptingOrders = !data.temporaryClosure.isClosed;
    }

    delete updatePayload.temporaryClosure;

    const updated = await prisma.restaurantSettings.upsert({
      where: { id: "default" },
      update: updatePayload,
      create: {
        id: "default",
        ...updatePayload,
      },
    });

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

    const liveStatus = evaluateBusinessHours(
      updated.openingHours as any,
      (updated.openingHours as any)?.temporaryClosure
    );

    return Response.json({ ok: true, settings: updated, liveStatus });
  } catch (error) {
    console.error("[settings PUT] error:", error);
    return Response.json({ ok: false, error: "Failed to update settings." }, { status: 500 });
  }
}
