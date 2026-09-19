import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { processCustomerMessage } from "@/lib/ai/engine";
import { sendText, sendButtons } from "./client";
import type { InboundMessage } from "./types";

/**
 * Handle one inbound customer WhatsApp message end-to-end for A-ONE Restaurant.
 * Fully thread-safe, idempotent, multi-user isolated, with rich button and text replies.
 */
export async function handleInbound(message: InboundMessage): Promise<void> {
  const phone = message.waId.startsWith("+") ? message.waId : `+${message.waId}`;
  const rawText = (message.text || "").trim();

  // 1. Idempotency Check: Don't re-process duplicate WhatsApp message IDs
  if (message.id) {
    const existing = await prisma.message.findUnique({
      where: { whatsappMessageId: message.id },
    });
    if (existing) {
      console.log(`[whatsapp] Duplicate message skipped: ${message.id}`);
      return;
    }
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

  if (!config.whatsapp.autoReply) {
    return;
  }

  try {
    // 5. Process message through Master AI Engine
    const botReply = await processCustomerMessage({
      rawText,
      conversationId: conversation.id,
      customerId: customer.id,
      customerPhone: phone,
      customerName: customer.name || undefined,
      isButtonPayload: Boolean(message.replyId),
    });

    if (!botReply.text) {
      return;
    }

    // 6. Save Assistant Message to DB
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: botReply.text,
        messageType: botReply.orderCreated ? "ORDER_SUMMARY" : "TEXT",
        status: "SENT",
        metadata: botReply.orderCreated ? (botReply.orderCreated as any) : undefined,
      },
    });

    // 7. Dispatch reply via WhatsApp Cloud API
    if (botReply.buttons && botReply.buttons.length > 0) {
      await sendButtons(message.waId, botReply.text, botReply.buttons, "A-ONE Restaurant");
    } else {
      await sendText(message.waId, botReply.text);
    }
  } catch (error) {
    console.error("[whatsapp:handleInbound] processing error:", error);
    // Send safe fallback message to customer
    const fallbackText =
      "Maazrat, system mein thora issue aa raha hai. Aap thori dair baad dobara try karein ya hamare staff se rabta karein.";
    await sendText(message.waId, fallbackText);
  }
}
