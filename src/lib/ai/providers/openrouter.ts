import { config } from "@/lib/config";
import type { AIProvider, ChatTurn } from "../types";
import { parseSSE } from "./openai";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1";

export function createOpenRouterProvider(): AIProvider {
  const apiKey = config.ai.openrouterKey;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set.");
  }

  const model = config.ai.openrouterModel || config.ai.model || "openrouter/free";

  return {
    name: "openrouter",
    async *streamChat({ system, messages }) {
      const body = {
        model,
        stream: true,
        max_tokens: config.ai.maxTokens,
        messages: [
          { role: "system", content: system },
          ...messages.map((m: ChatTurn) => ({ role: m.role, content: m.content })),
        ],
      };

      try {
        const res = await fetch(`${OPENROUTER_ENDPOINT}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": config.app.url || "https://aonefoods.com",
            "X-Title": config.app.name || "A-ONE Restaurant",
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(25_000),
        });

        if (!res.ok || !res.body) {
          const detail = await res.text().catch(() => "");
          // Sanitize error detail to prevent any accidental credential leak
          const cleanDetail = detail.replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, "Bearer [REDACTED]");
          throw new Error(`OpenRouter API error (${res.status}): ${cleanDetail.slice(0, 300)}`);
        }

        yield* parseSSE(res.body, (json) => json?.choices?.[0]?.delta?.content ?? "");
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw err;
        }
        throw new Error("Failed to connect to OpenRouter AI service.");
      }
    },
  };
}

/**
 * Server-side diagnostic test for OpenRouter connectivity.
 */
export async function testOpenRouterRequest(testPrompt = "Hello! Please reply with a brief greeting for A-ONE Restaurant."): Promise<{ ok: boolean; response?: string; error?: string; model: string }> {
  const apiKey = config.ai.openrouterKey;
  const model = config.ai.openrouterModel || config.ai.model || "openrouter/free";

  if (!apiKey) {
    return { ok: false, error: "OPENROUTER_API_KEY is not configured", model };
  }

  try {
    const res = await fetch(`${OPENROUTER_ENDPOINT}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": config.app.url || "https://aonefoods.com",
        "X-Title": config.app.name || "A-ONE Restaurant",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: testPrompt }],
        max_tokens: 150,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      return { ok: false, error: `HTTP ${res.status}: ${errText.slice(0, 200)}`, model };
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "";
    return { ok: true, response: reply, model };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err), model };
  }
}

