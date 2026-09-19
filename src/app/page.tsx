import { getSession } from "@/lib/session";
import { canAccessAdmin } from "@/lib/auth";
import { AOneWelcomeHero } from "@/components/welcome/AOneWelcomeHero";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  const isAuthenticated = canAccessAdmin(session);

  return <AOneWelcomeHero isAuthenticated={isAuthenticated} />;
}
