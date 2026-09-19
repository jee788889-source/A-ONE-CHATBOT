import type { Department } from "@/lib/brands";
import type { ChatAction } from "@/types";

const ESCALATION_TRIGGERS = [
  "talk to a human", "speak to a human", "talk to staff", "speak to manager",
  "customer service", "call me", "call back", "staff member", "baat karni hai",
  "baat karwao", "shikayat", "complaint", "order problem",
];

export function shouldEscalate(message: string): boolean {
  const text = (message || "").toLowerCase();
  return ESCALATION_TRIGGERS.some((trigger) => text.includes(trigger));
}

export function detectAction(
  message: string,
  department: Department | null
): ChatAction | undefined {
  return undefined;
}

export function suggestFollowUps(
  message: string,
  department: Department | null
): string[] {
  return [
    "📋 View Today's Menu",
    "🍔 A-ONE Special Beef Smash Burger",
    "🍛 Chicken Dum Biryani",
    "📍 Location & Opening Hours",
  ];
}
