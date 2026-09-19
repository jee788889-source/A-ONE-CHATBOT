import type { Department } from "@/lib/brands";
import type { KnowledgeEntry } from "@/types";
import { AONE_COMPANY } from "@/data/aone-foods/company";

const AONE_KB: KnowledgeEntry[] = AONE_COMPANY.faqs.map((f, i) => ({
  id: `faq-${i + 1}`,
  department: "RESTAURANT" as any,
  kind: "FAQ" as any,
  category: "General",
  question: f.q,
  answer: f.a,
  keywords: f.q.toLowerCase().split(" "),
}));

export function retrieveKnowledge(
  department: Department,
  query: string,
  limit = 6
): KnowledgeEntry[] {
  const q = (query || "").toLowerCase();
  if (!q) return AONE_KB.slice(0, limit);

  return AONE_KB.filter((k) =>
    k.question.toLowerCase().includes(q) || k.keywords.some((w: string) => q.includes(w))
  ).slice(0, limit);
}

export function searchKnowledge(query: string, limit = 10): KnowledgeEntry[] {
  return retrieveKnowledge("RESTAURANT", query, limit);
}
