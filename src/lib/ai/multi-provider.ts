import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "@/lib/config";
import { getRestaurantSettings } from "@/lib/settings-store";
import { MENU_DATA } from "@/lib/whatsapp/menu-catalog";

/**
 * Format hardcoded menu catalog for strict system prompt injection
 */
const MENU_SUMMARY_FOR_AI = Object.entries(MENU_DATA)
  .map(([catKey, cat]) => {
    const items = cat.rows
      .map((r) => `  - ${r.title}: ${r.description}`)
      .join("\n");
    return `[${cat.title}]\n${items}`;
  })
  .join("\n\n");

export function getStrictSystemPrompt(strictMode = true): string {
  if (!strictMode) {
    return `You are the AI Assistant for A-One Foods. Reply concisely in polite Roman Urdu (max 2 sentences) and guide the user to the menu buttons.`;
  }

  return `You are the AI Assistant for A-One Foods.

STRICT ZERO-HALLUCINATION GUARDRAILS:
1. You must NEVER hallucinate, guess, or invent any food item, discount, deal, price, or flavor outside of the provided MENU_DATA.
2. If the user asks about an unavailable product or dish, reply strictly:
"Maazrat, yeh item hamare menu mein available nahi hai. Menu dekhne ke liye 'View Menu' par tap karein."
3. Restrict responses to short, polite Roman Urdu (maximum 2 sentences).
4. Always encourage the customer to tap the interactive menu buttons to browse categories and place an order.

VERIFIED A-ONE FOODS MENU DATA:
${MENU_SUMMARY_FOR_AI}`;
}

export interface AIResponseResult {
  text: string;
  providerUsed: string;
  modelUsed: string;
}

/**
 * Call Google Gemini using @google/genai SDK
 */
async function callGemini(
  systemInstruction: string,
  userMessage: string,
  apiKey: string,
  model = "gemini-1.5-pro"
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: model.includes("gemini") ? model : "gemini-1.5-pro",
    contents: userMessage,
    config: {
      systemInstruction,
      temperature: 0.2,
      maxOutputTokens: 500,
    },
  });

  const text = response.text?.trim();
  if (!text) throw new Error("Empty response from Gemini.");
  return text;
}

/**
 * Call OpenAI API using official endpoint with GPT-4o
 */
async function callOpenAI(
  systemInstruction: string,
  userMessage: string,
  apiKey: string,
  model = "gpt-4o"
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model.includes("gpt") ? model : "gpt-4o",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 500,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(`OpenAI HTTP ${response.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response from OpenAI.");
  return text;
}

/**
 * Call Anthropic Claude using @anthropic-ai/sdk
 */
async function callClaude(
  systemInstruction: string,
  userMessage: string,
  apiKey: string,
  model = "claude-3-5-sonnet-20241022"
): Promise<string> {
  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: model.includes("claude") ? model : "claude-3-5-sonnet-20241022",
    max_tokens: 500,
    system: systemInstruction,
    messages: [{ role: "user", content: userMessage }],
  });

  const contentBlock = response.content?.[0];
  const text = contentBlock && contentBlock.type === "text" ? contentBlock.text.trim() : "";
  if (!text) throw new Error("Empty response from Claude.");
  return text;
}

/**
 * Multi-Provider AI Engine with zero-hallucination guardrails & automatic fallback
 */
export async function generateMultiProviderReply(
  userMessage: string,
  customInstruction?: string
): Promise<AIResponseResult> {
  let settings;
  try {
    const res = await getRestaurantSettings();
    settings = res.settings;
  } catch {
    // DB fallback
  }

  const aiSettings = (settings?.aiSettings as Record<string, any>) || {};
  const preferredProvider = (aiSettings.provider || config.ai.provider || "gemini").toLowerCase();
  const preferredModel = aiSettings.model || config.ai.model || "gemini-1.5-pro";
  const strictMode = aiSettings.strictGuardrails !== false;

  const geminiKey = aiSettings.geminiApiKey || config.ai.geminiKey || process.env.GEMINI_API_KEY;
  const openaiKey = aiSettings.openaiApiKey || config.ai.openaiKey || process.env.OPENAI_API_KEY;
  const anthropicKey = aiSettings.anthropicApiKey || config.ai.anthropicKey || process.env.ANTHROPIC_API_KEY;

  const systemPrompt = customInstruction || getStrictSystemPrompt(strictMode);

  // 1. Try Primary Selected Provider
  if (preferredProvider === "gemini" && geminiKey) {
    try {
      const text = await callGemini(systemPrompt, userMessage, geminiKey, preferredModel);
      return { text, providerUsed: "gemini", modelUsed: preferredModel };
    } catch (err: any) {
      console.warn("[Multi-Provider AI] Gemini error, trying fallback:", err.message);
    }
  } else if ((preferredProvider === "openai" || preferredProvider === "gpt-4o") && openaiKey) {
    try {
      const text = await callOpenAI(systemPrompt, userMessage, openaiKey, preferredModel);
      return { text, providerUsed: "openai", modelUsed: preferredModel };
    } catch (err: any) {
      console.warn("[Multi-Provider AI] OpenAI error, trying fallback:", err.message);
    }
  } else if ((preferredProvider === "anthropic" || preferredProvider === "claude") && anthropicKey) {
    try {
      const text = await callClaude(systemPrompt, userMessage, anthropicKey, preferredModel);
      return { text, providerUsed: "anthropic", modelUsed: preferredModel };
    } catch (err: any) {
      console.warn("[Multi-Provider AI] Claude error, trying fallback:", err.message);
    }
  }

  // 2. Fallbacks across available keys
  if (geminiKey) {
    try {
      const text = await callGemini(systemPrompt, userMessage, geminiKey, "gemini-1.5-pro");
      return { text, providerUsed: "gemini", modelUsed: "gemini-1.5-pro" };
    } catch {}
  }

  if (openaiKey) {
    try {
      const text = await callOpenAI(systemPrompt, userMessage, openaiKey, "gpt-4o");
      return { text, providerUsed: "openai", modelUsed: "gpt-4o" };
    } catch {}
  }

  if (anthropicKey) {
    try {
      const text = await callClaude(systemPrompt, userMessage, anthropicKey, "claude-3-5-sonnet-20241022");
      return { text, providerUsed: "anthropic", modelUsed: "claude-3-5-sonnet-20241022" };
    } catch {}
  }

  // 3. Graceful Localized Fallback
  return {
    text: "Ji janab! A-One Foods ka menu dekhne aur order karne ke liye 'View Menu' button par tap karein.",
    providerUsed: "local-rule",
    modelUsed: "fallback",
  };
}
