/**
 * Pure Edge-safe session verification for Next.js Middleware and API routes.
 * Zero Node.js dependencies (no bcrypt, no Prisma).
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";
import { config } from "./config";
import type { Role, UserStatus } from "@prisma/client";

export * from "./entitlements";

const secret = new TextEncoder().encode(config.jwt.secret);
const ISSUER = "aone-restaurant-portal";

export interface SessionPayload {
  sub: string; // user id
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  permissions?: string[];
  [key: string]: unknown;
}

/** Roles permitted into the restaurant management portal */
export const ALLOWED_ADMIN_ROLES: Role[] = ["OWNER", "MANAGER", "STAFF"];

/** Name of the httpOnly cookie carrying the session token */
export const SESSION_COOKIE = "aone_session";

/** True when the session belongs to the Owner (protected server-side) */
export function isOwner(session: SessionPayload | null): boolean {
  if (!session) return false;
  if (config.app.ownerEmail && session.email && session.email.toLowerCase() === config.app.ownerEmail.toLowerCase()) {
    return true;
  }
  return session.role === "OWNER";
}

/** True when the session is Owner or Manager */
export function isManagerOrOwner(session: SessionPayload | null): boolean {
  if (!session) return false;
  return isOwner(session) || session.role === "MANAGER";
}

/** True when the session may access the staff dashboard */
export function canAccessAdmin(session: SessionPayload | null): boolean {
  return Boolean(session && session.status === "ACTIVE" && ALLOWED_ADMIN_ROLES.includes(session.role));
}

/** Check specific granular permission with Owner override */
export function hasPermission(session: SessionPayload | null, permission: string): boolean {
  if (!session || session.status !== "ACTIVE") return false;
  if (isOwner(session)) return true;
  if (session.permissions?.includes("all") || session.permissions?.includes(permission)) return true;

  // Default role permission mapping
  if (session.role === "MANAGER") {
    const managerDefaults = [
      "view_conversations",
      "reply_conversations",
      "view_orders",
      "update_orders",
      "manage_menu",
      "view_customers",
    ];
    return managerDefaults.includes(permission);
  }

  if (session.role === "STAFF") {
    const staffDefaults = [
      "view_conversations",
      "reply_conversations",
      "view_orders",
      "update_assigned_orders",
    ];
    return staffDefaults.includes(permission);
  }

  return false;
}

/** Issue a signed JWT for an authenticated user */
export async function signSession(payload: SessionPayload): Promise<string> {
  // Enforce server-side owner role if email matches configured ownerEmail
  const isConfiguredOwner = Boolean(
    config.app.ownerEmail && payload.email && payload.email.toLowerCase() === config.app.ownerEmail.toLowerCase()
  );
  const effectiveRole = isConfiguredOwner ? "OWNER" : payload.role;

  return new SignJWT({ ...payload, role: effectiveRole })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(config.jwt.expiresIn)
    .setIssuer(ISSUER)
    .sign(secret);
}

/** Verify a JWT and return its payload, or null if invalid/expired */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: ISSUER });
    const session = payload as unknown as SessionPayload;

    // Guarantee server-side owner status if email matches configured owner email
    if (config.app.ownerEmail && session.email && session.email.toLowerCase() === config.app.ownerEmail.toLowerCase()) {
      session.role = "OWNER";
    }
    return session;
  } catch {
    return null;
  }
}

/** Get currently authenticated session from incoming cookies in Server Components & Routes */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return verifySession(token);
  } catch {
    return null;
  }
}

/** Require active admin session or redirect to login */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!canAccessAdmin(session)) {
    redirect("/login");
  }
  return session!;
}

