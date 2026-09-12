"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  RotateCcw,
  Sparkles,
  Search,
  Package,
  Building,
  PhoneCall,
  UserCheck,
  Instagram,
  Volume2,
  VolumeX,
  ExternalLink,
} from "lucide-react";
import { AOneLogo } from "@/components/branding/AOneLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import { ProductModal } from "./ProductModal";
import { AONE_PRODUCTS, searchProducts, type Product } from "@/data/aone-foods/products";
import { AONE_COMPANY } from "@/data/aone-foods/company";
import { speechTagFor } from "@/lib/i18n";
import { cn, generateConversationReference } from "@/lib/utils";
import type { ChatMessage } from "@/types";

const STORAGE_KEY = "aone.chat.session.v1";

const WELCOME_PROMPT = `Hello! 👋
I'm the A-ONE Foods AI Assistant.
How can I help you today?`;

const QUICK_ACTIONS = [
  { id: "explore", label: "Explore Products", icon: Sparkles, prompt: "Explore Products" },
  { id: "find", label: "Find a Product", icon: Search, prompt: "Find a Product" },
  { id: "info", label: "Product Information", icon: Package, prompt: "Tell me about your product packaging, quality and ingredients." },
  { id: "distributor", label: "Become a Distributor", icon: Building, prompt: "I want to become an authorized distributor of A-ONE Foods." },
  { id: "contact", label: "Contact A-ONE", icon: PhoneCall, prompt: "How can I contact A-ONE Foods?" },
  { id: "human", label: "Talk to a Human", icon: UserCheck, prompt: "I would like to speak with a human representative." },
];

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [voiceOut, setVoiceOut] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const conversationRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Restore chat state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        conversationRef.current = parsed.reference || generateConversationReference();
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          setMessages(parsed.messages);
        }
      } else {
        conversationRef.current = generateConversationReference();
      }
    } catch {
      conversationRef.current = generateConversationReference();
    }
    setHydrated(true);
  }, []);

  // Save state
  useEffect(() => {
    if (!hydrated || !conversationRef.current) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          reference: conversationRef.current,
          messages,
        })
      );
    } catch {
      // storage quota or private mode
    }
  }, [messages, hydrated]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, streaming]);

  // Text-to-speech
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechTagFor(text) || "en-US";
    window.speechSynthesis.speak(utterance);
  }, []);

  // Reset / New Chat
  function handleNewChat() {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    conversationRef.current = generateConversationReference();
    setMessages([]);
    setStreaming(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  // Send message
  const handleSend = useCallback(
    async (text: string) => {
      const userText = text.trim();
      if (!userText || streaming) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userText,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setStreaming(true);

      const assistantMsgId = `ai-${Date.now()}`;
      let accumulated = "";
      let attachedProducts: Product[] = [];
      let showDistributorForm = false;
      let showHandoff = false;
      let quickReplies: string[] = [];

      // Local client heuristic for instant high-speed reactions
      const lower = userText.toLowerCase();
      if (lower.includes("explore") || lower.includes("product") || lower.includes("snacks") || lower.includes("nimko") || lower.includes("masala") || lower.includes("پروڈکٹس") || lower.includes("چیزیں")) {
        attachedProducts = searchProducts(userText).slice(0, 4);
        if (attachedProducts.length === 0) {
          attachedProducts = AONE_PRODUCTS.slice(0, 4);
        }
      }

      if (lower.includes("distributor") || lower.includes("dealership") || lower.includes("wholesale") || lower.includes("bulk") || lower.includes("ڈسٹری بیوٹر")) {
        showDistributorForm = true;
      }

      if (lower.includes("human") || lower.includes("agent") || lower.includes("talk to a human") || lower.includes("call") || lower.includes("whatsapp") || lower.includes("نمائندے")) {
        showHandoff = true;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            conversationRef: conversationRef.current,
          }),
        });

        if (!res.ok) {
          throw new Error("Chat request failed");
        }

        // Check content type: SSE stream or JSON
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("text/event-stream")) {
          const reader = res.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) throw new Error("No stream reader");

          let buffer = "";

          // Placeholder assistant message
          setMessages((prev) => [
            ...prev,
            {
              id: assistantMsgId,
              role: "assistant",
              content: "",
              products: attachedProducts,
              showDistributorForm,
              showHandoff,
              createdAt: new Date().toISOString(),
            },
          ]);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              try {
                const data = JSON.parse(trimmed.replace(/^data:\s*/, ""));
                if (data.type === "chunk") {
                  accumulated += data.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId ? { ...m, content: accumulated } : m
                    )
                  );
                } else if (data.type === "done") {
                  if (data.products && Array.isArray(data.products) && data.products.length > 0) {
                    attachedProducts = data.products;
                  }
                  if (data.showDistributorForm !== undefined) {
                    showDistributorForm = data.showDistributorForm;
                  }
                  if (data.showHandoff !== undefined) {
                    showHandoff = data.showHandoff;
                  }
                  if (data.quickReplies && Array.isArray(data.quickReplies)) {
                    quickReplies = data.quickReplies;
                  }

                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? {
                            ...m,
                            content: accumulated || m.content,
                            products: attachedProducts,
                            showDistributorForm,
                            showHandoff,
                            quickReplies,
                          }
                        : m
                    )
                  );
                }
              } catch {
                // Ignore parse errors on partial chunks
              }
            }
          }
        } else {
          // Standard JSON response
          const json = await res.json();
          accumulated = json.message || "I'm here to assist you with A-ONE Foods products and services.";
          if (json.products && Array.isArray(json.products)) {
            attachedProducts = json.products;
          }
          if (json.showDistributorForm !== undefined) {
            showDistributorForm = json.showDistributorForm;
          }
          if (json.showHandoff !== undefined) {
            showHandoff = json.showHandoff;
          }
          if (json.quickReplies && Array.isArray(json.quickReplies)) {
            quickReplies = json.quickReplies;
          }

          setMessages((prev) => [
            ...prev,
            {
              id: assistantMsgId,
              role: "assistant",
              content: accumulated,
              products: attachedProducts,
              showDistributorForm,
              showHandoff,
              quickReplies,
              createdAt: new Date().toISOString(),
            },
          ]);
        }

        if (voiceOut && accumulated) {
          speak(accumulated);
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          // User canceled
          return;
        }
        // Polite customer-facing error per requirements
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: "Something went wrong. Please try again.",
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming, voiceOut, speak]
  );

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground select-text overflow-hidden">
      {/* ================================================= Header ============ */}
      <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-stone-200/80 dark:border-stone-800/80 bg-card/85 px-3.5 sm:px-6 backdrop-blur-md">
        {/* Brand identity & status */}
        <div className="flex items-center gap-3">
          <AOneLogo size="md" />

          {/* Status badge */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Official Instagram Link */}
          <a
            href={AONE_COMPANY.social.instagram}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-pink-600 hover:bg-pink-500/10 transition-colors"
            title="Follow A-ONE Foods on Instagram"
          >
            <Instagram className="size-4" />
            <span className="hidden md:inline">@aone_foods</span>
          </a>

          {/* Voice output toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setVoiceOut((v) => !v)}
            className="size-8 rounded-xl text-muted-foreground hover:text-foreground"
            title={voiceOut ? "Mute read-aloud" : "Enable read-aloud"}
            aria-label="Toggle voice responses"
          >
            {voiceOut ? <Volume2 className="size-4 text-primary" /> : <VolumeX className="size-4" />}
          </Button>

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* New Chat Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            className="h-8 gap-1.5 rounded-xl text-xs font-medium border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800"
            title="Start a new chat session"
          >
            <RotateCcw className="size-3.5 text-muted-foreground" />
            <span className="hidden xs:inline">New Chat</span>
          </Button>
        </div>
      </header>

      {/* ================================================= Conversation Area == */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-6 sm:py-6 scroll-slim"
      >
        <div className="mx-auto flex max-w-4xl flex-col space-y-6">
          {/* Welcome State (Visible when no messages yet) */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center text-center py-6 sm:py-12 animate-in fade-in duration-300">
              <AOneLogo size="xl" variant="icon" className="mb-4" />

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground max-w-md">
                Hello! 👋
              </h2>
              <p className="text-base sm:text-lg font-medium text-primary mt-1">
                I&apos;m the A-ONE Foods AI Assistant.
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                How can I help you today?
              </p>

              {/* Smart Quick Suggestion Buttons */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full max-w-2xl">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleSend(action.prompt)}
                      className="group flex flex-col items-start p-3 sm:p-3.5 rounded-2xl border border-stone-200/90 dark:border-stone-800/90 bg-card hover:border-primary/40 hover:bg-stone-50 dark:hover:bg-stone-900/60 shadow-2xs hover:shadow-sm transition-all text-left"
                    >
                      <div className="rounded-xl bg-primary/10 p-2 text-primary group-hover:scale-105 transition-transform mb-2">
                        <Icon className="size-4" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors">
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Brand assurance note */}
              <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>Verified products, authentic Pakistani spices, and official distributor services.</span>
              </div>
            </div>
          )}

          {/* Render Messages */}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onSpeak={speak}
              onViewProductDetails={(prod) => setSelectedProduct(prod)}
              onAskAi={(prompt) => handleSend(prompt)}
              onQuickReply={(reply) => handleSend(reply)}
            />
          ))}

          {/* Streaming Typing Indicator */}
          {streaming && (
            <div className="flex w-full gap-3">
              <div className="shrink-0 mt-0.5">
                <div className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-red-600 text-white font-bold text-xs">
                  A1
                </div>
              </div>
              <TypingIndicator />
            </div>
          )}
        </div>
      </div>

      {/* ================================================= Floating Input Area */}
      <div className="sticky bottom-0 z-20 border-t border-stone-200/80 dark:border-stone-800/80 bg-background/90 px-3.5 py-3 sm:px-6 backdrop-blur-md">
        <ChatInput
          onSend={handleSend}
          streaming={streaming}
          onStop={() => {
            if (abortRef.current) abortRef.current.abort();
            setStreaming(false);
          }}
          placeholder="Ask A-ONE anything… (English, اردو, Roman Urdu)"
        />
        <div className="mx-auto mt-2 text-center text-[10px] text-muted-foreground/70">
          A-ONE Foods Official Customer Assistant · Responses are grounded in verified company information.
        </div>
      </div>

      {/* ================================================= Product Details Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAskAi={(prompt) => {
          setSelectedProduct(null);
          handleSend(prompt);
        }}
      />
    </div>
  );
}
