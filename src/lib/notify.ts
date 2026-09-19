import { prisma } from "./db";
import { logAuditEvent } from "./auth";

export interface TeamNotification {
  title: string;
  message: string;
  link?: string;
  type?: string;
}

/**
 * Queue a notification for staff and owner in A-ONE Restaurant.
 */
export async function notifyTeam(notification: TeamNotification): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        title: notification.title,
        message: notification.message,
        link: notification.link,
        type: notification.type || "INFO",
      },
    });
  } catch (error) {
    console.warn("[notify] notification queue skipped:", error);
  }
}

export interface AuditEntry {
  action: string;
  message?: string;
  level?: "INFO" | "WARN" | "ERROR";
  actorEmail?: string;
  target?: string;
  ipAddress?: string;
}

export async function logEvent(entry: AuditEntry): Promise<void> {
  try {
    await logAuditEvent({
      actorEmail: entry.actorEmail || "system",
      action: entry.action,
      target: entry.target,
      details: { message: entry.message, level: entry.level },
      ipAddress: entry.ipAddress,
    });
  } catch (error) {
    console.warn("[notify] audit event skipped:", error);
  }
}
