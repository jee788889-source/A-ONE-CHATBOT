import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BRANDS, type Department } from "./brands";

/** Merge Tailwind class names with conflict resolution (shadcn/ui convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Short, human-friendly random id used for reference numbers.
 * Alphabet excludes look-alike characters (0/O, 1/I/L) so references can be
 * read out over the phone or WhatsApp without ambiguity.
 */
export function shortId(length = 8): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

/** The kinds of records that carry a customer-facing reference number. */
export type ReferenceKind =
  | "LEAD"
  | "ADM"
  | "TKT"
  | "QTE"
  | "MTG"
  | "ENR"
  | "CONV"
  | "BCAST";

/**
 * Build a department-scoped reference, e.g. `AONE-ORD-7F3K2Q9A` (Order reference)
 * or `KTN-ORD-4X8T2M6C` (Kitchen reference).
 */
export function generateReference(
  kind: ReferenceKind,
  department: Department,
  length = 8
): string {
  return `${BRANDS[department].referencePrefix}${kind}-${shortId(length)}`;
}

/** Conversation reference used for A-ONE conversations. */
export function generateConversationReference(): string {
  return `AONE-CONV-${shortId(10)}`;
}

/** Very light script check: true if the text contains Urdu/Punjabi (Arabic) script. */
export function isUrduScript(text: string): boolean {
  return /[؀-ۿ]/.test(text);
}

/** Format a number as Pakistani Rupees without pulling in a currency library. */
export function formatPkr(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return `PKR ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(amount)}`;
}

/** Short, stable date rendering for tables and cards (server + client safe). */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Date + time rendering for meetings and activity feeds. */
export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Turn `PROPOSAL_SENT` into `Proposal sent` for UI labels. */
export function humanise(value: string): string {
  const spaced = value.replace(/_/g, " ").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Truncate long text for list views without breaking mid-word where possible. */
export function truncate(text: string, max = 120): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut}…`;
}
