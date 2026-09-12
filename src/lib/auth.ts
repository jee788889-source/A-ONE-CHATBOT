/**
 * Authentication helpers — JWT (via `jose`, Edge-safe) + bcrypt password hashing.
 *
 * `jose` is used instead of `jsonwebtoken` so tokens can be verified in both
 * Node and Edge runtimes (e.g. middleware) without polyfills.
 */
import { SignJWT, jwtVerify } from "jose";
import { config } from "./config";
import type { Department, UserRole } from "@prisma/client";

const secret = new TextEncoder().encode(config.jwt.secret);

const ISSUER = "bitsol-ai-assistant";

export interface SessionPayload {
  sub: string; // user id
  role: UserRole;
  name: string;
  /** Business the staff member belongs to; null = both (super admin). */
  department?: Department | null;
  [key: string]: unknown;
}

/** Roles allowed into the admin console. */
export const ADMIN_ROLES: UserRole[] = [
  "AGENT",
  "INSTRUCTOR",
  "ADMIN",
  "SUPER_ADMIN",
];

/** True when the session may open the admin console at all. */
export function canAccessAdmin(session: SessionPayload | null): boolean {
  return Boolean(session && ADMIN_ROLES.includes(session.role));
}

/**
 * True when the session may read/write records belonging to `department`.
 * Staff scoped to one business never see the other business's pipeline.
 */
export function canAccessDepartment(
  session: SessionPayload | null,
  department: Department
): boolean {
  if (!session) return false;
  if (session.role === "SUPER_ADMIN" || session.role === "ADMIN") return true;
  return !session.department || session.department === department;
}

/** Hash a plaintext password for storage. */
export async function hashPassword(plain: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  const mod = (bcrypt.default ?? bcrypt) as { hash: (s: string, r: number) => Promise<string> };
  return mod.hash(plain, config.bcryptRounds);
}

/** Verify a plaintext password against a stored hash. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  const bcrypt = await import("bcryptjs");
  const mod = (bcrypt.default ?? bcrypt) as { compare: (s: string, h: string) => Promise<boolean> };
  return mod.compare(plain, hash);
}

/** Issue a signed JWT for an authenticated user. */
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(config.jwt.expiresIn)
    .setIssuer(ISSUER)
    .sign(secret);
}

/** Verify a JWT and return its payload, or null if invalid/expired. */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: ISSUER });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

/** Name of the httpOnly cookie carrying the session token. */
export const SESSION_COOKIE = "bitsol_session";
