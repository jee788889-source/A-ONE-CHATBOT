/** Shared domain types used by both client and server code. */

import type { Department } from "@/lib/brands";
import type { Language } from "@/lib/i18n";

import type { Product } from "@/data/aone-foods/products";

export type { Department, DepartmentSlug } from "@/lib/brands";
export type { Language } from "@/lib/i18n";

// ------------------------------------------------------------------- Chat ---

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** Which business this turn belongs to (null before the user has chosen). */
  department?: Department | null;
  createdAt?: string;
  /** A-ONE Foods attached products */
  products?: Product[];
  /** Whether to render an inline distributor inquiry form */
  showDistributorForm?: boolean;
  /** Whether to render a human / WhatsApp handoff card */
  showHandoff?: boolean;
  /** Suggested reply buttons */
  quickReplies?: string[];
}

/** A tappable quick-reply / suggestion surfaced to the user. */
export interface QuickReply {
  label: string;
  /** The text sent to the assistant when tapped (defaults to `label`). */
  value?: string;
}

/**
 * A structured workflow the assistant can hand off to the UI — e.g. once the
 * user says "I want a quote", the model finishes its sentence and the client
 * opens the matching form instead of collecting nine fields conversationally.
 */
export type ChatActionKind =
  | "LEAD_FORM"
  | "MEETING_FORM"
  | "QUOTE_FORM"
  | "SUPPORT_FORM"
  | "ADMISSION_FORM"
  | "CAREER_FORM"
  | "CHOOSE_DEPARTMENT";

export interface ChatAction {
  kind: ChatActionKind;
  /** Pre-selected service or course slug, when the user named one. */
  subject?: string;
}

/** SSE event payloads streamed from /api/chat to the browser. */
export type ChatStreamEvent =
  | { type: "meta"; department: Department | null; language: Language }
  | { type: "chunk"; text: string }
  | {
      type: "done";
      ticketId?: string;
      department: Department | null;
      suggestions?: string[];
      action?: ChatAction;
    }
  | { type: "error"; message: string };

// -------------------------------------------------------- Knowledge base ----

export type KnowledgeKind =
  | "FAQ"
  | "ARTICLE"
  | "SERVICE"
  | "COURSE"
  | "POLICY"
  | "DOCUMENT";

/** One entry in a department knowledge base. */
export interface KnowledgeEntry {
  id: string;
  department: Department;
  kind: KnowledgeKind;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

// ------------------------------------------------------------- Catalogues ---

/** Pricing is a placeholder until BITSOL publishes final rate cards. */
export interface PricePlaceholder {
  /** Human-readable starting point, e.g. "From PKR 45,000". */
  startingAt: string;
  /** Billing shape, e.g. "one-time project" or "monthly retainer". */
  model: string;
  /** Always shown so the assistant never presents a price as final. */
  note: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** A BITSOL Marketing service, rendered in the menu and answered from the KB. */
export interface ServiceItem {
  slug: string;
  name: string;
  group: string;
  tagline: string;
  overview: string;
  benefits: string[];
  features: string[];
  process: string[];
  pricing: PricePlaceholder;
  portfolio: string[];
  faqs: FaqItem[];
  keywords: string[];
}

export interface CourseInstalment {
  label: string;
  detail: string;
}

/** A BITSOL Institute course, rendered in the menu and answered from the KB. */
export interface CourseItem {
  slug: string;
  name: string;
  group: string;
  tagline: string;
  overview: string;
  curriculum: string[];
  duration: string;
  /** Placeholder fee — confirmed by the admissions office. */
  fee: PricePlaceholder;
  instalments: CourseInstalment[];
  trainer: string;
  careers: string[];
  projects: string[];
  certification: string;
  eligibility: string;
  keywords: string[];
}

/** A menu entry shown in the department menu panel. */
export interface MenuEntry {
  id: string;
  label: string;
  labelUr: string;
  /** Prompt sent to the assistant when tapped. */
  prompt: string;
  /** Optional structured workflow to open instead of sending a prompt. */
  action?: ChatAction;
  children?: MenuEntry[];
}

// ------------------------------------------------------------ Submissions ---

export interface LeadSubmission {
  name: string;
  company?: string;
  phone: string;
  email?: string;
  businessType?: string;
  service?: string;
  budget?: string;
  timeline?: string;
  requirements: string;
  conversationRef?: string;
}

export interface AdmissionSubmission {
  studentName: string;
  fatherName?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  qualification?: string;
  city?: string;
  course: string;
  preferredBatch?: string;
  notes?: string;
  conversationRef?: string;
}

export interface MeetingSubmission {
  department: Department;
  name: string;
  phone: string;
  email?: string;
  businessName?: string;
  preferredDate: string;
  preferredTime: string;
  mode: "OFFICE" | "ZOOM" | "GOOGLE_MEET" | "WHATSAPP";
  topic?: string;
  conversationRef?: string;
}

export interface TicketSubmission {
  department: Department;
  category: "TECHNICAL" | "BILLING" | "SALES" | "COMPLAINT" | "GENERAL";
  name: string;
  phone?: string;
  email?: string;
  subject: string;
  description: string;
  conversationRef?: string;
}

/** Uniform shape returned by every submission endpoint. */
export interface SubmissionResult {
  ok: boolean;
  reference?: string;
  message: string;
}
