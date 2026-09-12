"use client";

import React from "react";
import { User2, Volume2, Sparkles } from "lucide-react";
import { cn, isUrduScript } from "@/lib/utils";
import type { ChatMessage } from "@/types";
import type { Product } from "@/data/aone-foods/products";
import { ProductCard } from "./ProductCard";
import { DistributorForm } from "./DistributorForm";
import { HumanHandoffCard } from "./HumanHandoffCard";

interface MessageBubbleProps {
  message: ChatMessage;
  onSpeak?: (text: string) => void;
  onViewProductDetails?: (product: Product) => void;
  onAskAi?: (prompt: string) => void;
  onQuickReply?: (reply: string) => void;
}

export function MessageBubble({
  message,
  onSpeak,
  onViewProductDetails,
  onAskAi,
  onQuickReply,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const rtl = isUrduScript(message.content);

  return (
    <div className={cn("flex w-full gap-2.5 sm:gap-3.5", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="grid size-8 place-items-center rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 shadow-xs">
            <User2 className="size-4" />
          </div>
        ) : (
          <div className="relative flex size-8 sm:size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 p-0.5 shadow-sm ring-1 ring-amber-400/30">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-stone-950 text-amber-400">
              <span className="font-black text-[11px] tracking-tight">A1</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
          </div>
        )}
      </div>

      {/* Message Content Container */}
      <div
        className={cn(
          "group relative flex flex-col space-y-2.5 max-w-[88%] sm:max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Text Bubble */}
        {message.content && (
          <div
            className={cn(
              "relative rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs transition-all",
              isUser
                ? "rounded-tr-xs bg-primary text-primary-foreground"
                : "rounded-tl-xs bg-card text-card-foreground border border-stone-200/80 dark:border-stone-800/80"
            )}
          >
            <div className={cn(rtl && "urdu")}>
              {renderContent(message.content)}
            </div>

            {/* Read Aloud Button */}
            {!isUser && message.content && onSpeak && (
              <button
                type="button"
                onClick={() => onSpeak(message.content)}
                aria-label="Read this answer aloud"
                className="absolute -bottom-3 right-2 hidden rounded-full bg-background p-1.5 text-muted-foreground shadow-sm ring-1 ring-border transition-all group-hover:block hover:text-primary"
              >
                <Volume2 className="size-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Attached Products Grid / Showcase */}
        {message.products && message.products.length > 0 && (
          <div className="w-full pt-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
              <Sparkles className="size-3.5 text-amber-500" />
              <span>Recommended Products ({message.products.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {message.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewDetails={(prod) => onViewProductDetails?.(prod)}
                  onAskAi={(pName) => onAskAi?.(`Tell me more about ${pName}, its ingredients and availability.`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Inline Distributor Form */}
        {message.showDistributorForm && (
          <div className="w-full pt-1 max-w-xl">
            <DistributorForm />
          </div>
        )}

        {/* Inline Human Handoff Card */}
        {message.showHandoff && (
          <div className="w-full pt-1 max-w-xl">
            <HumanHandoffCard />
          </div>
        )}

        {/* Quick Replies below AI Message */}
        {message.quickReplies && message.quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {message.quickReplies.map((reply, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onQuickReply?.(reply)}
                className="rounded-full border border-stone-200 dark:border-stone-800 bg-card hover:bg-stone-50 dark:hover:bg-stone-900 px-3 py-1 text-xs font-medium text-foreground hover:text-primary transition-colors shadow-2xs"
              >
                {reply}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Markdown & Safe Text Formatter */
function renderContent(text: string) {
  return text.split("\n").map((line, i) => {
    const trimmed = line.trimStart();

    if (!trimmed) return <span key={i} className="block h-2" />;

    // Markdown Heading 3 or bold line
    const h3Match = /^###\s+(.+)$/.exec(trimmed);
    if (h3Match) {
      return (
        <h4 key={i} className={cn("font-bold text-base text-foreground", i > 0 && "mt-2.5")}>
          {h3Match[1]}
        </h4>
      );
    }

    const boldHeading = /^\*\*(.+)\*\*:?$/.exec(trimmed);
    if (boldHeading) {
      return (
        <p key={i} className={cn("font-bold text-foreground", i > 0 && "mt-2.5")}>
          {boldHeading[1]}
        </p>
      );
    }

    // Bullet and numbered list items
    const bullet = /^([-*•])\s+/.exec(trimmed);
    const numbered = /^(\d+)\.\s+/.exec(trimmed);
    const clean = trimmed.replace(/^([-*•]|\d+\.)\s+/, "");

    if (bullet || numbered) {
      return (
        <p key={i} className={cn("flex gap-2", i > 0 && "mt-1")}>
          <span className="select-none text-amber-500 font-bold">{numbered ? `${numbered[1]}.` : "•"}</span>
          <span className="flex-1">{formatInline(clean)}</span>
        </p>
      );
    }

    return (
      <p key={i} className={cn(i > 0 && "mt-1.5")}>
        {formatInline(line)}
      </p>
    );
  });
}

function formatInline(text: string): React.ReactNode {
  // Bold, italic, and URLs
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|https?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.length > 2 && part.startsWith("_") && part.endsWith("_")) {
      return (
        <em key={i} className="opacity-90 italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("http://") || part.startsWith("https://")) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline hover:text-primary/80 font-medium"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
