/**
 * Authentication & Server-Side RBAC for A-ONE Restaurant.
 * JWT (via `jose`, Edge-safe) + bcrypt password hashing + audit trail.
 */
import { SignJWT, jwtVerify } from "jose";
import { config } from "./config";
import type { Role, UserStatus } from "@prisma/client";


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

/** Hash a plaintext password for storage */
export async function hashPassword(plain: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  const mod = (bcrypt.default ?? bcrypt) as { hash: (s: string, r: number) => Promise<string> };
  return mod.hash(plain, config.bcryptRounds);
}

/** Verify a plaintext password against a stored hash */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  const bcrypt = await import("bcryptjs");
  const mod = (bcrypt.default ?? bcrypt) as { compare: (s: string, h: string) => Promise<boolean> };
  return mod.compare(plain, hash);
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

/** Helper to log audit events into the database */
export async function logAuditEvent(params: {
  actorId?: string;
  actorEmail: string;
  action: string;
  target?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const { prisma } = await import("./db");
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        action: params.action,
        target: params.target,
        details: params.details as object,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (err) {
    console.error("[AuditLog Error]", err);
  }
}
