import { config } from "@/lib/config";
import type { AIProvider, ChatTurn } from "../types";
import { parseSSE } from "./openai";

export function createOpenRouterProvider(): AIProvider {
  const baseUrl = "https://openrouter.ai/api/v1";
  const apiKey = config.ai.openrouterKey;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set.");
  }

  return {
    name: "openrouter",
    async *streamChat({ system, messages }) {
      const body = {
        model: config.ai.model || "anthropic/claude-3.5-sonnet",
        stream: true,
        max_tokens: config.ai.maxTokens,
        messages: [
          { role: "system", content: system },
          ...messages.map((m: ChatTurn) => ({ role: m.role, content: m.content })),
        ],
      };

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": config.app.url,
          "X-Title": config.app.name,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20_000),
      });

      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => "");
        throw new Error(`OpenRouter error (${res.status}): ${detail.slice(0, 300)}`);
      }

      yield* parseSSE(res.body, (json) => json?.choices?.[0]?.delta?.content ?? "");
    },
  };
}
