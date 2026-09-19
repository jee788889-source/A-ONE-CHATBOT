import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { canAccessAdmin } from "@/lib/auth";
import { fetchAllCustomers } from "@/lib/customer-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!canAccessAdmin(session)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search")?.trim() || undefined;

  try {
    const customers = await fetchAllCustomers(search);
    return Response.json({ ok: true, customers });
  } catch (error: any) {
    console.error("[customers GET] error:", error);
    return Response.json({ ok: false, error: error?.message || "Failed to fetch customers." }, { status: 500 });
  }
}
