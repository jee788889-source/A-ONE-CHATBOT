import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: { default: "Operations Portal", template: "%s · A-ONE Restaurant" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <AdminShell
      user={{
        id: session.sub,
        name: session.name,
        email: session.email,
        role: session.role,
        status: session.status,
      }}
      permissions={session.permissions}
    >
      {children}
    </AdminShell>
  );
}
