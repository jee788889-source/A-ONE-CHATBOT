/**
 * Internal Entitlement & Access Control for A-ONE Restaurant.
 * Private restaurant system: All authorized internal accounts (OWNER, MANAGER, STAFF)
 * have permanent unlimited system usage with zero trial expiry or subscription limits.
 */
import type { Role, UserStatus } from "@prisma/client";
import type { SessionPayload } from "./session";

export interface AccountEntitlement {
  unlimited: boolean;
  isTrial: boolean;
  isExpired: boolean;
  plan: "INTERNAL_PERMANENT_UNLIMITED";
  expiresAt: null;
  features: {
    whatsappChatbot: boolean;
    orderManagement: boolean;
    menuManagement: boolean;
    staffManagement: boolean;
    systemSettings: boolean;
    auditLogs: boolean;
  };
}

/**
 * Returns the permanent unlimited entitlement structure for any authorized internal account.
 * Enforces role boundaries while granting permanent unlimited operations access.
 */
export function getInternalEntitlement(role: Role, status: UserStatus = "ACTIVE"): AccountEntitlement {
  const isActive = status === "ACTIVE";

  return {
    unlimited: isActive,
    isTrial: false,
    isExpired: false,
    plan: "INTERNAL_PERMANENT_UNLIMITED",
    expiresAt: null,
    features: {
      whatsappChatbot: isActive,
      orderManagement: isActive,
      menuManagement: isActive && (role === "OWNER" || role === "MANAGER"),
      staffManagement: isActive && role === "OWNER",
      systemSettings: isActive && role === "OWNER",
      auditLogs: isActive && role === "OWNER",
    },
  };
}

/**
 * Server-side verification that an internal user has active unlimited access.
 */
export function verifyUnlimitedEntitlement(session: SessionPayload | null): boolean {
  if (!session || session.status !== "ACTIVE") return false;
  return session.role === "OWNER" || session.role === "MANAGER" || session.role === "STAFF";
}
