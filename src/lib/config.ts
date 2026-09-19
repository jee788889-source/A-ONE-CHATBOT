/**
 * Server-side runtime configuration for A-ONE Restaurant.
 *
 * Import this only from server code (route handlers, server components, lib).
 */
import { z } from "zod";

const bool = (def: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v == null ? def : /^(1|true|yes|on)$/i.test(v)));

const optional = z.string().optional();

const nodeEnv = z.preprocess((value) => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "development";
  if (raw === "development" || raw === "dev") return "development";
  if (raw === "test") return "test";
  return "production";
}, z.enum(["development", "test", "production"]));

const schema = z.object({
  NODE_ENV: nodeEnv.default("development"),
  APP_NAME: z.string().default("A-ONE Restaurant"),
  APP_URL: z.string().default("http://localhost:3000"),

  DATABASE_URL: optional,
  DIRECT_DATABASE_URL: optional,

  OWNER_EMAIL: optional,

  JWT_SECRET: z.string().default("aone-restaurant-secure-jwt-key-2025"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(10),

  AI_PROVIDER: z.enum(["anthropic", "openai", "gemini", "claude", "openrouter"]).default("anthropic"),
  AI_MODEL: optional,
  OPENROUTER_MODEL: optional,
  AI_MAX_TOKENS: z.coerce.number().int().positive().default(800),
  AI_API_KEY: optional,
  ANTHROPIC_API_KEY: optional,
  OPENROUTER_API_KEY: optional,
  OPENAI_API_KEY: optional,
  GEMINI_API_KEY: optional,

  // WhatsApp Cloud API
  WHATSAPP_TOKEN: optional,
  WHATSAPP_ACCESS_TOKEN: optional,
  WHATSAPP_PHONE_ID: optional,
  WHATSAPP_PHONE_NUMBER_ID: optional,
  WHATSAPP_WABA_ID: optional,
  WHATSAPP_BUSINESS_ACCOUNT_ID: optional,
  WHATSAPP_VERIFY_TOKEN: optional,
  WHATSAPP_APP_SECRET: optional,
  WHATSAPP_API_VERSION: z.string().default("v21.0"),
  WHATSAPP_AUTO_REPLY: bool(true),

  // Restaurant alerts
  ORDER_NOTIFY_EMAIL: optional,
  ORDER_NOTIFY_PHONE: optional,
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.warn(
    "[A-ONE Config] Warning: Invalid or missing environment variables:",
    parsed.error.format()
  );
}

const env = parsed.success ? parsed.data : schema.parse({});

const activeAIProvider =
  env.AI_PROVIDER === "openrouter" || (Boolean(env.OPENROUTER_API_KEY) && env.AI_PROVIDER === "anthropic" && !env.ANTHROPIC_API_KEY)
    ? "openrouter"
    : env.AI_PROVIDER;

const activeAIModel =
  activeAIProvider === "openrouter"
    ? (env.OPENROUTER_MODEL || env.AI_MODEL || "openrouter/free")
    : (env.AI_MODEL || "claude-3-5-sonnet-20241022");

export const config = {
  env: env.NODE_ENV,
  isDev: env.NODE_ENV === "development",
  isProd: env.NODE_ENV === "production",
  app: {
    name: env.APP_NAME,
    url: env.APP_URL,
    ownerEmail: (env.OWNER_EMAIL && env.OWNER_EMAIL.trim()) ? env.OWNER_EMAIL.trim().toLowerCase() : "",
  },
  db: {
    url: env.DATABASE_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  bcryptRounds: env.BCRYPT_ROUNDS,
  ai: {
    provider: activeAIProvider,
    model: activeAIModel,
    openrouterModel: env.OPENROUTER_MODEL || env.AI_MODEL || "openrouter/free",
    maxTokens: env.AI_MAX_TOKENS,
    apiKey: activeAIProvider === "openrouter"
      ? (env.OPENROUTER_API_KEY || env.AI_API_KEY)
      : (env.AI_API_KEY || env.ANTHROPIC_API_KEY || env.OPENROUTER_API_KEY || env.OPENAI_API_KEY || env.GEMINI_API_KEY),
    anthropicKey: env.ANTHROPIC_API_KEY,
    openrouterKey: env.OPENROUTER_API_KEY || env.AI_API_KEY,
    openaiKey: env.OPENAI_API_KEY,
    geminiKey: env.GEMINI_API_KEY,
  },
  whatsapp: {
    token: env.WHATSAPP_TOKEN || env.WHATSAPP_ACCESS_TOKEN,
    phoneId: env.WHATSAPP_PHONE_ID || env.WHATSAPP_PHONE_NUMBER_ID,
    wabaId: env.WHATSAPP_WABA_ID || env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    verifyToken: env.WHATSAPP_VERIFY_TOKEN,
    appSecret: env.WHATSAPP_APP_SECRET,
    apiVersion: env.WHATSAPP_API_VERSION,
    autoReply: env.WHATSAPP_AUTO_REPLY,
  },
  orders: {
    notifyEmail: env.ORDER_NOTIFY_EMAIL,
    notifyPhone: env.ORDER_NOTIFY_PHONE,
  },
};

