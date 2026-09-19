import { config } from "@/lib/config";
import type { AIProvider, ChatTurn } from "../types";

export function createOpenAIProvider(isOllama = false): AIProvider {
  const baseUrl = "https://api.openai.com/v1";
  const apiKey = config.ai.openaiKey;

  if (!apiKey && !isOllama) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  return {
    name: isOllama ? "ollama" : "openai",
    async *streamChat({ system, messages }) {
      const body = {
        model: config.ai.model || "gpt-4o",
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
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => "");
        throw new Error(`OpenAI error (${res.status}): ${detail.slice(0, 300)}`);
      }

      yield* parseSSE(res.body, (json) => json?.choices?.[0]?.delta?.content ?? "");
    },
  };
}

export async function* parseSSE(
  stream: ReadableStream<Uint8Array>,
  extractor?: (json: any) => string
): AsyncGenerator<string, void, unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) continue;
        if (trimmed.startsWith("data:")) {
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") return;
          if (extractor) {
            try {
              const text = extractor(JSON.parse(data));
              if (text) yield text;
            } catch {
              // ignore invalid json chunks
            }
          } else {
            yield data;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
