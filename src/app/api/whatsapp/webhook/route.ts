import { NextRequest } from "next/server";
import { config } from "@/lib/config";
import { logEvent } from "@/lib/notify";
import { verifySignature } from "@/lib/whatsapp/client";
import { parseInbound, parseStatuses } from "@/lib/whatsapp/parse";
import { handleInbound } from "@/lib/whatsapp/handler";
import { prisma } from "@/lib/db";
import type { WhatsAppWebhookBody } from "@/lib/whatsapp/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * WhatsApp Cloud API webhook for A-ONE Restaurant.
 * GET: Verification challenge.
 * POST: Inbound customer messages & delivery status updates.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (!config.whatsapp.verifyToken) {
    console.error("[whatsapp] WHATSAPP_VERIFY_TOKEN is not configured.");
    return new Response("Webhook not configured", { status: 500 });
  }

  if (mode === "subscribe" && token === config.whatsapp.verifyToken && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();

  console.log(">>> [ACTIVE WEBHOOK HIT: /api/whatsapp/webhook] Received raw body:", raw.slice(0, 300));

  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) {
    console.warn("[whatsapp] rejected webhook with invalid signature.");
    await logEvent({
      action: "WHATSAPP_WEBHOOK_REJECTED",
      message: "Inbound webhook failed signature verification.",
      level: "WARN",
    });
    return new Response("Invalid signature", { status: 401 });
  }

  let body: WhatsAppWebhookBody;
  try {
    body = JSON.parse(raw) as WhatsAppWebhookBody;
  } catch {
    return new Response("OK", { status: 200 });
  }

  try {
    // 1. Process Message Status Updates (Delivered / Read)
    for (const status of parseStatuses(body)) {
      if (!status.id || !status.status) continue;
      const statusMap: Record<string, "SENT" | "DELIVERED" | "READ" | "FAILED"> = {
        sent: "SENT",
        delivered: "DELIVERED",
        read: "READ",
        failed: "FAILED",
      };
      const dbStatus = statusMap[status.status];
      if (dbStatus === "FAILED") {
        // Meta accepted the send but could not deliver it (e.g. #131047 outside
        // the 24h window, #131030 number not on a test app's recipient list).
        console.error(
          `[whatsapp] delivery to ${status.recipient_id} failed:`,
          JSON.stringify(status.errors ?? [])
        );
      }
      if (dbStatus) {
        await prisma.message
          .updateMany({
            where: { whatsappMessageId: status.id },
            data: { status: dbStatus },
          })
          .catch(() => {});
      }
    }

    // 2. Process Inbound Messages
    const messages = parseInbound(body);
    for (const message of messages) {
      await handleInbound(message);
    }
  } catch (error) {
    console.error("[whatsapp] webhook processing error:", error);
  }

  return new Response("OK", { status: 200 });
}
