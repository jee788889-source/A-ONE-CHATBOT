import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession, canAccessAdmin } from "@/lib/session";

/**
 * Edge middleware guarding the admin console.
 *
 * This is defence in depth, not the only gate: `requireAdmin()` in the admin
 * layout re-checks the session on every render, and each API route checks it
 * again before writing. Doing it here as well means an unauthenticated request
 * is turned away before any page code or database query runs.
 *
 * `jose` verification works in the Edge runtime, which is why auth.ts uses it
 * rather than `jsonwebtoken`.
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!canAccessAdmin(session)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Only the console — public pages, the chat API and static assets are untouched.
  matcher: ["/admin/:path*"],
};
