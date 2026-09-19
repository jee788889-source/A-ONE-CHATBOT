import { config } from "@/lib/config";
import type { AIProvider } from "../types";
import { parseSSE } from "./openai";

export function createGeminiProvider(): AIProvider {
  const apiKey = config.ai.geminiKey;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  return {
    name: "gemini",
    async *streamChat({ system, messages }) {
      const model = config.ai.model || "gemini-1.5-pro";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:streamGenerateContent?alt=sse`;

      const body = {
        systemInstruction: { parts: [{ text: system }] },
        generationConfig: { maxOutputTokens: config.ai.maxTokens },
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => "");
        throw new Error(`Gemini error (${res.status}): ${detail.slice(0, 300)}`);
      }

      for await (const data of parseSSE(res.body)) {
        try {
          const parsed = JSON.parse(data) as {
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
          };
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) yield text;
        } catch {
          // ignore incomplete frames
        }
      }
    },
  };
}
