"use client";

import React, { useEffect } from "react";
import { X, Sparkles, CheckCircle2, Package, ShieldCheck, Clock, MapPin, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/aone-foods/products";
import { cn } from "@/lib/utils";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAskAi: (prompt: string) => void;
}

export function ProductModal({ product, onClose, onAskAi }: ProductModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (product) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [product, onClose]);

  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[90dvh] overflow-hidden rounded-3xl bg-card text-card-foreground border border-stone-200 dark:border-stone-800 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Image banner */}
        <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full overflow-hidden bg-stone-900">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover object-center brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors backdrop-blur-md"
            aria-label="Close details"
          >
            <X className="size-4" />
          </button>

          {/* Badges on banner */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
            <div>
              <span className="inline-block rounded-full bg-amber-500/90 text-stone-950 px-2.5 py-0.5 text-[11px] font-bold shadow">
                {product.category}
              </span>
              <h3 id="product-modal-title" className="text-xl sm:text-2xl font-bold text-white mt-1 drop-shadow">
                {product.name}
              </h3>
            </div>
            <span className="urdu text-lg font-bold text-amber-200 shrink-0 drop-shadow">
              {product.urduName}
            </span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scroll-slim text-sm">
          {/* Descriptions */}
          <div className="space-y-2">
            <p className="text-foreground leading-relaxed">
              {product.description}
            </p>
            <p className="urdu text-muted-foreground bg-stone-50 dark:bg-stone-900/60 p-3 rounded-xl border border-stone-200/50 dark:border-stone-800/50">
              {product.urduDescription}
            </p>
          </div>

          {/* Verified Ingredients (ONLY if verified) */}
          {product.verifiedSpecs.ingredients && product.verifiedSpecs.ingredients.length > 0 && (
            <div className="rounded-2xl bg-stone-50 dark:bg-stone-900/40 p-3.5 sm:p-4 border border-stone-200/60 dark:border-stone-800/60">
              <h4 className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2.5">
                <Layers className="size-3.5 text-amber-500" />
                Verified Ingredients
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {product.verifiedSpecs.ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-lg bg-card px-2.5 py-1 text-xs font-medium border border-stone-200/80 dark:border-stone-700/80 shadow-2xs"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Available Packaging & Sizes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-stone-200/70 dark:border-stone-800/70 p-3 bg-card/60">
              <h5 className="flex items-center gap-1.5 font-bold text-xs text-muted-foreground uppercase tracking-wider mb-2">
                <Package className="size-3.5 text-primary" />
                Available Pack Sizes
              </h5>
              <ul className="space-y-1 text-xs">
                {product.verifiedSpecs.availableSizes.map((sz, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary/70" />
                    <span>{sz}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-stone-200/70 dark:border-stone-800/70 p-3 bg-card/60">
              <h5 className="flex items-center gap-1.5 font-bold text-xs text-muted-foreground uppercase tracking-wider mb-2">
                <MapPin className="size-3.5 text-emerald-600" />
                Verified Availability
              </h5>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {product.verifiedSpecs.availability}
              </p>
              {product.verifiedSpecs.shelfLife && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400">
                  <Clock className="size-3 text-muted-foreground" />
                  <span>Shelf life: {product.verifiedSpecs.shelfLife}</span>
                </div>
              )}
            </div>
          </div>

          {/* Storage & Serving */}
          {product.verifiedSpecs.storage && (
            <div className="text-xs text-muted-foreground border-t border-stone-100 dark:border-stone-800/80 pt-3">
              <strong className="text-foreground">Storage Instructions:</strong> {product.verifiedSpecs.storage}
            </div>
          )}

          {/* Certifications */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="size-3.5" /> 100% Halal Certified
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
              <CheckCircle2 className="size-3.5" /> Quality Tested Ingredients
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 px-4 py-3 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Close
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => {
              onClose();
              onAskAi(`Tell me more about ${product.name}, its recipe or packaging.`);
            }}
            className="gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Sparkles className="size-3.5" />
            Ask AI About {product.name}
          </Button>
        </div>
      </div>
    </div>
  );
}
