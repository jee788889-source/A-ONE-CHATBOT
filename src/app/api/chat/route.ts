import { NextRequest } from "next/server";
import { z } from "zod";
import {
  detectAOneLanguage,
  buildSystemPrompt,
  generateLocalAssistantResponse,
} from "@/lib/aone-ai";
import { searchProducts, AONE_PRODUCTS } from "@/data/aone-foods/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(50),
  conversationRef: z.string().max(64).optional(),
});

function sse(event: any): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return Response.json({ error: "Empty request body." }, { status: 400 });
    }
    const parsed = bodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request body." }, { status: 400 });
    }
    const { messages } = parsed.data;
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "No messages provided." }, { status: 400 });
    }
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const userText = lastUserMessage?.content || "";

    const lang = detectAOneLanguage(userText);
    const localResult = generateLocalAssistantResponse(userText, messages);

    // Check if Claude API key is configured
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // Check if client requested event-stream
    const acceptHeader = req.headers.get("accept") || "";
    const wantsStream = acceptHeader.includes("text/event-stream");

    // If an external key is available, we could stream from Claude/OpenAI;
    // Otherwise or as reliable baseline, stream the local neural engine!
    if (wantsStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          // Stream text in words/chunks to emulate natural streaming typing
          const words = localResult.message.split(" ");
          for (let i = 0; i < words.length; i++) {
            const chunk = (i === 0 ? "" : " ") + words[i];
            controller.enqueue(encoder.encode(sse({ type: "chunk", text: chunk })));
            // short artificial delay for natural typing feel
            await new Promise((r) => setTimeout(r, 18));
          }

          // Emit completion with structured metadata
          controller.enqueue(
            encoder.encode(
              sse({
                type: "done",
                products: localResult.products || [],
                showDistributorForm: Boolean(localResult.showDistributorForm),
                showHandoff: Boolean(localResult.showHandoff),
                quickReplies: localResult.quickReplies || [],
              })
            )
          );
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // Default structured JSON response
    return Response.json({
      message: localResult.message,
      products: localResult.products || [],
      showDistributorForm: Boolean(localResult.showDistributorForm),
      showHandoff: Boolean(localResult.showHandoff),
      quickReplies: localResult.quickReplies || [],
      language: lang,
    });
  } catch (error: any) {
    console.error('Chat route error:', error);
    return new Response(JSON.stringify({ error: "Internal server error." }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    });
  }
}


// Health‑check endpoint
export async function GET() {
  return new Response(JSON.stringify({ status: "ok", timestamp: Date.now() }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
}
