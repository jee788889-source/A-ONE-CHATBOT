import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { processCustomerMessage } from "@/lib/ai/engine";
import { sendText, sendButtons, sendList, type SendResult } from "./client";
import type { InboundMessage } from "./types";

/**
 * Message IDs handled by this instance recently. The database unique index is
 * the real idempotency guard; this only covers the case where the database is
 * unreachable and Meta redelivers the same message.
 */
const recentMessageIds = new Set<string>();
const RECENT_LIMIT = 500;

function rememberMessageId(id: string): boolean {
  if (recentMessageIds.has(id)) return false;
  recentMessageIds.add(id);
  if (recentMessageIds.size > RECENT_LIMIT) {
    const oldest = recentMessageIds.values().next().value;
    if (oldest) recentMessageIds.delete(oldest);
  }
  return true;
}

interface PersistedInbound {
  customerId: string;
  customerName?: string;
  conversationId: string;
}

/**
 * Handle one inbound customer WhatsApp message end-to-end for A-ONE Restaurant.
 *
 * Saving to the database is best-effort: if Supabase is unreachable the
 * customer still gets a reply, the conversation just isn't recorded in the
 * admin inbox. A database outage must never make the bot go silent.
 */
export async function handleInbound(message: InboundMessage): Promise<void> {
  console.log(">>> [ACTIVE WEBHOOK HIT: handleInbound] Received message:", JSON.stringify(message, null, 2));
  const phone = message.waId.startsWith("+") ? message.waId : `+${message.waId}`;
  const rawText = (message.text || "").trim();

  if (message.id && !rememberMessageId(message.id)) {
    console.log(`[whatsapp] Duplicate message skipped: ${message.id}`);
    return;
  }

  let persisted: PersistedInbound | null = null;
  let dbAvailable = true;
  try {
    persisted = await persistInbound(message, phone, rawText);
    if (!persisted) {
      console.log(`[whatsapp] Duplicate message skipped: ${message.id}`);
      return;
    }
  } catch (error) {
    dbAvailable = false;
    console.error(
      "[whatsapp:handleInbound] database unavailable, replying without saving:",
      error instanceof Error ? error.message : error
    );
  }

  if (!config.whatsapp.autoReply) {
    return;
  }

  // Without the database, key the in-memory cart/state on the customer's number.
  const conversationId = persisted?.conversationId ?? `wa:${message.waId}`;
  const customerId = persisted?.customerId ?? `wa:${message.waId}`;
  const customerName = persisted?.customerName ?? message.profileName;

  try {
    // 5. Process message through Master AI Engine. A button tap is routed by
    // its id (`act:view_menu`), which is what the NLU matches on; the title is
    // only what the customer saw.
    const botReply = await processCustomerMessage({
      rawText: message.replyId || rawText,
      conversationId,
      customerId,
      customerPhone: phone,
      customerName,
      isButtonPayload: Boolean(message.replyId),
    });

    if (!botReply.text) {
      console.log(`[whatsapp] No auto-reply for ${phone}: conversation is handed off to staff.`);
      return;
    }

    // 6. Dispatch reply via WhatsApp Cloud API
    let sent: SendResult;
    if (botReply.list && botReply.list.rows && botReply.list.rows.length > 0) {
      sent = await sendList(
        message.waId,
        botReply.text,
        botReply.list.buttonLabel,
        botReply.list.rows,
        botReply.list.header
      );
    } else if (botReply.buttons && botReply.buttons.length > 0) {
      sent = await sendButtons(message.waId, botReply.text, botReply.buttons, "A-ONE Restaurant");
    } else {
      sent = await sendText(message.waId, botReply.text);
    }

    if (!sent.ok) {
      console.error(`[whatsapp] reply to ${phone} was not delivered: ${sent.error}`);
    }

    // 7. Save Assistant Message to DB
    if (dbAvailable) {
      await prisma.message
        .create({
          data: {
            conversationId,
            role: "ASSISTANT",
            content: botReply.text,
            messageType: botReply.orderCreated ? "ORDER_SUMMARY" : "TEXT",
            status: sent.ok ? "SENT" : "FAILED",
            whatsappMessageId: sent.messageId || undefined,
            metadata: botReply.orderCreated ? (botReply.orderCreated as any) : undefined,
          },
        })
        .catch((error) => console.error("[whatsapp] could not save assistant reply:", error));
    }
  } catch (error) {
    console.error("[whatsapp:handleInbound] processing error:", error);
    // Send safe fallback message to customer
    const fallbackText =
      "Maazrat, system mein thora issue aa raha hai. Aap thori dair baad dobara try karein ya hamare staff se rabta karein.";
    await sendText(message.waId, fallbackText);
  }
}

/**
 * Record the customer, conversation and inbound message.
 * Returns null when this WhatsApp message ID was already processed.
 */
async function persistInbound(
  message: InboundMessage,
  phone: string,
  rawText: string
): Promise<PersistedInbound | null> {
  // 1. Idempotency Check: Don't re-process duplicate WhatsApp message IDs
  if (message.id) {
    const existing = await prisma.message.findUnique({
      where: { whatsappMessageId: message.id },
    });
    if (existing) return null;
  }

  // 2. Resolve or Create Customer
  const customer = await prisma.customer.upsert({
    where: { phone },
    update: {
      name: message.profileName || undefined,
    },
    create: {
      phone,
      name: message.profileName || `Customer ${phone.slice(-4)}`,
    },
  });

  // 3. Resolve or Create Conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      customerId: customer.id,
      channel: "WHATSAPP",
      status: { in: ["OPEN", "PENDING"] },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        customerId: customer.id,
        channel: "WHATSAPP",
        status: "OPEN",
        unreadCount: 1,
        lastMessageAt: new Date(),
      },
    });
  } else {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        unreadCount: { increment: 1 },
        lastMessageAt: new Date(),
      },
    });
  }

  // 4. Save Inbound Message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "USER",
      content: rawText || "[Interactive Button / Selection]",
      messageType: "TEXT",
      whatsappMessageId: message.id || undefined,
      status: "DELIVERED",
    },
  });

  return {
    customerId: customer.id,
    customerName: customer.name || undefined,
    conversationId: conversation.id,
  };
}
