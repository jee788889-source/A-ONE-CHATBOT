"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HelpCircle,
  Sparkles,
  X,
  Search,
  ChevronRight,
  ArrowRight,
  ShoppingBag,
  UtensilsCrossed,
  MessagesSquare,
  CreditCard,
  Bot,
  UserCheck,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Role } from "@prisma/client";

interface QAItem {
  id: string;
  keywords: string[];
  questionUrdu: string;
  questionEng: string;
  answerUrdu: string;
  answerEng: string;
  targetRoute?: string;
  actionLabel?: string;
}

const KNOWLEDGE_BASE: QAItem[] = [
  {
    id: "add_menu",
    keywords: ["menu", "add menu", "dish", "khana", "item add", "new item", "price change", "menu kaise"],
    questionUrdu: "Menu kaise add ya update karun?",
    questionEng: "How do I add or update menu items?",
    answerUrdu:
      "Menu manage karne ke liye 'Menu & Categories' page par jayein. Wahan 'Add Item' par click karein ya existing items ka price, description aur In-Stock / Out-of-Stock switch live toggle karein.",
    answerEng:
      "Go to 'Menu & Categories' from the sidebar. Click 'Add Item' to create dishes or toggle availability and prices in real-time.",
    targetRoute: "/admin/menu",
    actionLabel: "Go to Menu Management",
  },
  {
    id: "check_orders",
    keywords: ["order", "orders", "order kahan", "check order", "kitchen", "live order", "delivery"],
    questionUrdu: "Orders kahan se check aur update hotay hain?",
    questionEng: "Where do I track and manage live orders?",
    answerUrdu:
      "Orders Management page par tamam WhatsApp aur manual orders real-time show hotay hain. Har order ko 'New' se 'Preparing' -> 'Ready' -> 'Out for Delivery' -> 'Completed' move kar sakte hain.",
    answerEng:
      "Open 'Orders Management' to view all live orders. Move orders across kitchen workflows (New, Preparing, Ready, Delivered).",
    targetRoute: "/admin/orders",
    actionLabel: "Open Orders Management",
  },
  {
    id: "whatsapp_chat",
    keywords: ["chat", "customer chat", "whatsapp", "inbox", "purani chat", "history", "message"],
    questionUrdu: "Customer ki purani chat aur WhatsApp messages kahan hain?",
    questionEng: "Where can I view customer WhatsApp conversations?",
    answerUrdu:
      "WhatsApp Live Inbox par har customer ki complete message history dastyab hai. Wahan customer ke previous orders, delivery address aur direct reply options maujood hain.",
    answerEng:
      "Open 'WhatsApp Inbox' to see full conversation threads, customer profile, and order history.",
    targetRoute: "/admin/conversations",
    actionLabel: "Open WhatsApp Inbox",
  },
  {
    id: "verify_payment",
    keywords: ["payment", "verify", "online payment", "jazzcash", "easypaisa", "bank", "receipt", "screenshot", "transaction id"],
    questionUrdu: "Online payment verify kahan se karni hai?",
    questionEng: "How do I review and verify customer online payments?",
    answerUrdu:
      "Orders Management page par 'Pending Verification' filter select karein. Wahan customer ka transaction ID aur payment details verify kar ke 'PAYMENT RECEIVED' ya 'PAYMENT NOT RECEIVED' par click karein.",
    answerEng:
      "Go to Orders Management and filter by 'Pending Verification' to review transaction IDs and approve/reject payments.",
    targetRoute: "/admin/orders?status=PENDING_VERIFICATION",
    actionLabel: "Review Pending Payments",
  },
  {
    id: "stop_ai",
    keywords: ["ai stop", "ai pause", "take over", "human", "manual", "staff take over", "ai band"],
    questionUrdu: "WhatsApp AI ko manually kaise stop ya take over karun?",
    questionEng: "How do I pause AI and take over a customer chat manually?",
    answerUrdu:
      "WhatsApp Inbox mein customer ki conversation open karein aur top-right par 'AI ACTIVE (Take Over)' button dabayein. Conversation mode 'HUMAN' ho jayega aur AI automated reply foran ruk jayenge.",
    answerEng:
      "In WhatsApp Inbox, select the chat and click 'AI ACTIVE (Take Over)'. Automated replies pause instantly.",
    targetRoute: "/admin/conversations",
    actionLabel: "Go to WhatsApp Inbox",
  },
  {
    id: "resume_ai",
    keywords: ["resume ai", "ai on", "ai start", "restart ai", "wapas ai"],
    questionUrdu: "Chat par AI dubara kaise resume karun?",
    questionEng: "How do I resume automated AI responses for a chat?",
    answerUrdu:
      "Inbox mein jab aap staff manual response complete kar lein, to 'HUMAN HANDLING (Resume AI)' button dabayein. Aglay messages AI handle karega.",
    answerEng:
      "In WhatsApp Inbox, click 'HUMAN HANDLING (Resume AI)' to hand the conversation back to the AI assistant.",
    targetRoute: "/admin/conversations",
    actionLabel: "Go to WhatsApp Inbox",
  },
  {
    id: "manual_order",
    keywords: ["manual order", "phone order", "walkin", "naya order", "create order"],
    questionUrdu: "Phone call ya walk-in customer ka manual order kaise enter karun?",
    questionEng: "How do I create a manual order for a call or walk-in customer?",
    answerUrdu:
      "Orders Management page par top-right par '+ Manual Order' button click karein. Customer name, phone, delivery address aur items enter kar ke 'Create & Dispatch' karein.",
    answerEng:
      "Click '+ Manual Order' on the Orders page to enter phone or walk-in orders with custom items.",
    targetRoute: "/admin/orders",
    actionLabel: "Create Manual Order",
  },
];

export function AOneAssistantWidget({ userRole }: { userRole: Role }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedQA, setSelectedQA] = useState<QAItem | null>(null);

  // Filter Q&As based on user query
  const filteredQA = query.trim()
    ? KNOWLEDGE_BASE.filter((qa) => {
        const q = query.toLowerCase();
        return (
          qa.keywords.some((kw) => kw.includes(q) || q.includes(kw)) ||
          qa.questionUrdu.toLowerCase().includes(q) ||
          qa.questionEng.toLowerCase().includes(q) ||
          qa.answerUrdu.toLowerCase().includes(q) ||
          qa.answerEng.toLowerCase().includes(q)
        );
      })
    : KNOWLEDGE_BASE;

  function triggerRestartTour() {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent("aone:restart_tour"));
  }

  function handleNavigate(route: string) {
    setIsOpen(false);
    router.push(route);
  }

  return (
    <>
      {/* Subtle floating Help / Assistant button */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open A-ONE Assistant"
          className="group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-neutral-900/95 border border-amber-500/40 text-neutral-100 shadow-xl shadow-black/60 hover:bg-neutral-800 hover:border-amber-500 transition-all duration-200 backdrop-blur-md"
        >
          <div className="size-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-neutral-950 font-bold">
            <Sparkles className="size-3.5" />
          </div>
          <span className="text-xs font-bold tracking-tight text-white pr-1">
            A-ONE Assistant
          </span>
          <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded-full hidden sm:inline-block">
            Help
          </span>
        </button>
      </div>

      {/* Assistant Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full sm:max-w-xl max-h-[85vh] h-[85vh] sm:h-auto rounded-t-3xl sm:rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col text-neutral-100 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    A-ONE Interactive Assistant
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Natural Q&A in Roman Urdu & English for operations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSelectedQA(null);
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3.5 border-b border-neutral-800 bg-neutral-950/40">
              <div className="relative">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedQA(null);
                  }}
                  placeholder="Ask in Roman Urdu or English (e.g. 'menu kaise add karun?', 'order kahan hai?')"
                  className="pl-9 bg-neutral-950 border-neutral-800 text-xs h-9 text-neutral-100 placeholder:text-neutral-500 focus-visible:ring-amber-500/50"
                />
              </div>
            </div>

            {/* Body: List or Selected Q&A */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-slim">
              {selectedQA ? (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <button
                    type="button"
                    onClick={() => setSelectedQA(null)}
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    ← Back to all questions
                  </button>

                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                    <h4 className="text-sm font-bold text-white">{selectedQA.questionUrdu}</h4>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {selectedQA.answerUrdu}
                    </p>
                    <div className="pt-2 border-t border-neutral-800/80">
                      <p className="text-[11px] text-neutral-400 italic">
                        {selectedQA.answerEng}
                      </p>
                    </div>
                  </div>

                  {selectedQA.targetRoute && (
                    <Button
                      onClick={() => handleNavigate(selectedQA.targetRoute!)}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs h-10"
                    >
                      {selectedQA.actionLabel || "Go to Section"}
                      <ArrowRight className="size-4 ml-2" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 px-1">
                    {query ? "Search Results" : "Common Operational Guides"}
                  </p>

                  {filteredQA.length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-500 space-y-2">
                      <HelpCircle className="size-8 mx-auto text-neutral-600" />
                      <p>No exact guide match found for &quot;{query}&quot;.</p>
                      <p className="text-neutral-400">
                        Try searching &quot;menu&quot;, &quot;order&quot;, &quot;payment&quot;, &quot;chat&quot;, or restart the full guided tour below.
                      </p>
                    </div>
                  ) : (
                    filteredQA.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedQA(item)}
                        className="w-full p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-amber-500/40 hover:bg-neutral-800/40 text-left transition flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-neutral-200 group-hover:text-amber-400 transition truncate">
                            {item.questionUrdu}
                          </p>
                          <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                            {item.questionEng}
                          </p>
                        </div>
                        <ChevronRight className="size-4 text-neutral-500 group-hover:text-amber-400 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer with Restart Tour option */}
            <div className="p-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs">
              <span className="text-neutral-500 text-[11px]">Need visual walk-through?</span>
              <Button
                variant="outline"
                size="sm"
                onClick={triggerRestartTour}
                className="border-neutral-800 bg-neutral-900 text-amber-400 text-xs h-8 hover:bg-neutral-800"
              >
                <RotateCcw className="size-3 mr-1.5" />
                Restart Quick Tour
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
