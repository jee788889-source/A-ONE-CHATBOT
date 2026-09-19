import type { Department } from "@/lib/brands";
import type { ChatTurn } from "./types";

export interface RoutingDecision {
  department: Department;
  confidence: number;
  switched: boolean;
  reason: string;
}

export function routeDepartment(
  messages: ChatTurn[],
  pinnedDepartment?: Department | null
): RoutingDecision {
  return {
    department: "RESTAURANT",
    confidence: 1.0,
    switched: false,
    reason: "A-ONE Restaurant unified dining & savories operations",
  };
}
