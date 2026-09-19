import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  canAccessAdmin,
  isOwner,
  isManagerOrOwner,
  hasPermission,
  verifySession,
  type SessionPayload,
} from "./auth";

/**
 * Server-side session helpers for App Router server components and route
 * handlers. `cookies()` is async in Next 15.
 */

/** Read and verify the current session, or null when signed out/invalid */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Require an active staff session for admin console */
export async function requireAdmin(next = "/admin"): Promise<SessionPayload> {
  const session = await getSession();
  if (!canAccessAdmin(session)) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  return session as SessionPayload;
}

/** Require the Owner role specifically */
export async function requireOwnerSession(): Promise<SessionPayload> {
  const session = await requireAdmin();
  if (!isOwner(session)) {
    redirect("/admin?error=unauthorized");
  }
  return session;
}

/** Require Manager or Owner role */
export async function requireManagerSession(): Promise<SessionPayload> {
  const session = await requireAdmin();
  if (!isManagerOrOwner(session)) {
    redirect("/admin?error=unauthorized");
  }
  return session;
}

/** Require a specific permission */
export async function requirePermissionSession(permission: string): Promise<SessionPayload> {
  const session = await requireAdmin();
  if (!hasPermission(session, permission)) {
    redirect("/admin?error=unauthorized");
  }
  return session;
}
