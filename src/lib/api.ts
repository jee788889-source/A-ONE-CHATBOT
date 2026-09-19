import type { NextRequest } from "next/server";
import { rateLimit } from "./redis";
import type { SubmissionResult } from "@/types";

/**
 * Shared API helpers for A-ONE Restaurant.
 */

/** Best-effort client IP, used for rate limiting and audit logs */
export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

/** Rate limit check */
export async function throttle(
  req: NextRequest,
  bucket: string,
  limit = 10,
  windowSeconds = 60
): Promise<Response | null> {
  const { allowed } = await rateLimit(`${bucket}:${clientIp(req)}`, limit, windowSeconds);
  if (allowed) return null;
  return Response.json(
    {
      ok: false,
      message: "Too many requests. Please wait a moment.",
    } satisfies SubmissionResult,
    { status: 429 }
  );
}

/** Uniform 400 for a failed Zod parse */
export function invalid(message = "Invalid input."): Response {
  return Response.json({ ok: false, message } satisfies SubmissionResult, {
    status: 400,
  });
}

/** Uniform 500 used when persistence fails */
export function failed(message = "Internal server error."): Response {
  return Response.json({ ok: false, message } satisfies SubmissionResult, {
    status: 500,
  });
}
