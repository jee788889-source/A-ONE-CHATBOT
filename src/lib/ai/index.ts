import { config } from "@/lib/config";
import { detectLanguage, type Language } from "@/lib/i18n";
import type { Department } from "@/lib/brands";
import type { AIProvider, ChatTurn } from "./types";
import { retrieveKnowledge } from "./knowledge";
import { buildSystemPrompt } from "./system-prompt";
import { routeDepartment, type RoutingDecision } from "./router";
import { createClaudeProvider } from "./providers/claude";
import { createOpenAIProvider } from "./providers/openai";
import { createGeminiProvider } from "./providers/gemini";
import { createOpenRouterProvider } from "./providers/openrouter";

export type { AIProvider, ChatTurn } from "./types";
export { routeDepartment } from "./router";
export { retrieveKnowledge, searchKnowledge } from "./knowledge";
export { detectAction, shouldEscalate, suggestFollowUps } from "./intents";
export { processCustomerMessage } from "./engine";
export { testOpenRouterRequest } from "./providers/openrouter";
export * from "./tools";
export * from "./cart";
export * from "./nlu";

/**
 * Resolve the configured AI provider for A-ONE Restaurant.
 */
export function getProvider(): AIProvider {
  const provider = config.ai.provider as string;

  if (provider === "openrouter" || config.ai.openrouterKey) {
    return createOpenRouterProvider();
  }

  switch (provider) {
    case "openai":
      return createOpenAIProvider(false);
    case "gemini":
      return createGeminiProvider();
    case "anthropic":
    case "claude":
    default:
      if (config.ai.openrouterKey) {
        return createOpenRouterProvider();
      }
      if (config.ai.openaiKey) {
        return createOpenAIProvider(false);
      }
      if (config.ai.geminiKey) {
        return createGeminiProvider();
      }
      return createOpenRouterProvider();
  }
}


export interface AssistantContext {
  department: Department | null;
  requestedDepartment?: Department | null;
}

export interface AssistantPlan {
  department: Department | null;
  language: Language;
  routing: RoutingDecision;
  system: string;
}

export function planAssistantTurn(
  messages: ChatTurn[],
  context: AssistantContext
): AssistantPlan {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const language = detectLanguage(lastUserMessage);
  const routing = routeDepartment(messages, context.requestedDepartment ?? context.department);
  const department = routing.department;
  const relevant = retrieveKnowledge(department, lastUserMessage);
  const system = buildSystemPrompt({
    department,
    language,
    relevant,
    switched: routing.switched,
  });

  return {
    department,
    language,
    routing,
    system,
  };
}

export async function* streamAssistantReply(
  messages: ChatTurn[],
  plan: AssistantPlan
): AsyncGenerator<string, void, unknown> {
  const provider = getProvider();
  for await (const chunk of provider.streamChat({
    system: plan.system,
    messages,
  })) {
    yield chunk;
  }
}

