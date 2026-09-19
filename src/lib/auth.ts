/**
 * Authentication & Server-Side RBAC for A-ONE Restaurant.
 * JWT (via `jose`, Edge-safe) + bcrypt password hashing + audit trail.
 */
import { config } from "./config";

export * from "./session";

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
