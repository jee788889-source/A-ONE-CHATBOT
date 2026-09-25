import { NextRequest } from "next/server";
import { getSession, isOwner } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  }

  return Response.json({
    ok: true,
    user: {
      id: session.sub,
      email: session.email,
      name: session.name,
      role: session.role,
      status: session.status,
      permissions: session.permissions || [],
      isOwner: isOwner(session),
    },
  });
}
