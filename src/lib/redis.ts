import Redis from "ioredis";

/**
 * Optional Redis client (rate-limiting, caching).
 * Returns `null` when REDIS_URL is not configured.
 */
const globalForRedis = globalThis as unknown as { redis: Redis | null | undefined };

function createClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;
  const client = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
  });
  client.on("error", (err) => console.error("[redis] connection error:", err.message));
  return client;
}

export const redis = globalForRedis.redis ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/**
 * Fixed-window rate limiter. Returns whether the action is allowed.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  if (!redis) return { allowed: true, remaining: limit };
  try {
    if (redis.status === "wait") await redis.connect();
    const bucket = `ratelimit:${key}`;
    const count = await redis.incr(bucket);
    if (count === 1) await redis.expire(bucket, windowSeconds);
    return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
  } catch {
    return { allowed: true, remaining: limit };
  }
}
