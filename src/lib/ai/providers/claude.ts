import Anthropic from "@anthropic-ai/sdk";
import { config } from "@/lib/config";
import type { AIProvider } from "../types";

export function createClaudeProvider(): AIProvider {
  const apiKey = config.ai.anthropicKey;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set.");
  }
  const client = new Anthropic({ apiKey });

  return {
    name: "claude",
    async *streamChat({ system, messages }) {
      const stream = client.messages.stream({
        model: config.ai.model,
        max_tokens: config.ai.maxTokens,
        system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          yield event.delta.text;
        }
      }
    },
  };
}
