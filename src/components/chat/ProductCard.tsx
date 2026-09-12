"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, Eye, CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/aone-foods/products";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onAskAi: (productName: string) => void;
  compact?: boolean;
}

export function ProductCard({
  product,
  onViewDetails,
  onAskAi,
  compact = false,
}: ProductCardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200">
      {/* Product Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100 dark:bg-stone-900">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-stone-900/80 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
            {product.category}
          </span>
          {product.badge && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-stone-950 shadow-sm">
              {product.badge}
            </span>
          )}
        </div>

        {/* Halal Badge */}
        <div className="absolute top-2.5 right-2.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 backdrop-blur-md px-2 py-0.5 text-[9px] font-semibold text-white shadow-sm">
            <CheckCircle2 className="size-2.5" /> Halal
          </span>
        </div>

        {/* Sizes banner at bottom of image */}
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-white/90">
          <span className="flex items-center gap-1 font-medium drop-shadow-sm">
            <Package className="size-3 text-amber-400" />
            {product.verifiedSpecs.availableSizes[0]}
          </span>
          <span className="text-[10px] text-white/70">
            {product.verifiedSpecs.availableSizes.length > 1
              ? `+${product.verifiedSpecs.availableSizes.length - 1} sizes`
              : ""}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="font-bold text-base leading-snug text-foreground group-hover:text-primary transition-colors">
            {product.name}
          </h4>
          <span className="urdu text-sm font-semibold text-muted-foreground shrink-0 leading-none">
            {product.urduName}
          </span>
        </div>

        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {product.description}
        </p>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-800/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(product)}
            className="flex-1 h-8 text-xs font-medium gap-1.5 rounded-lg border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800"
          >
            <Eye className="size-3.5 text-muted-foreground" />
            View Details
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => onAskAi(product.name)}
            className="h-8 px-2.5 text-xs font-medium gap-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors border-0"
            title="Ask AI about this product"
          >
            <Sparkles className="size-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
