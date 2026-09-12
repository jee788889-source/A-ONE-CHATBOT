import React from "react";
import { cn } from "@/lib/utils";

interface AOneLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "full" | "icon" | "badge";
}

export function AOneLogo({
  className,
  size = "md",
  showText = true,
  variant = "full",
}: AOneLogoProps) {
  const sizeMap = {
    sm: { icon: "size-8", title: "text-sm", sub: "text-[9px]" },
    md: { icon: "size-10", title: "text-base", sub: "text-[10px]" },
    lg: { icon: "size-12", title: "text-lg", sub: "text-xs" },
    xl: { icon: "size-16", title: "text-2xl", sub: "text-sm" },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {/* Brand Icon Badge */}
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 p-0.5 shadow-md ring-1 ring-amber-400/30",
          currentSize.icon
        )}
      >
        <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-gradient-to-b from-stone-900 to-stone-950 p-1 text-amber-400">
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-full w-full"
            aria-hidden="true"
          >
            {/* Outer Laurel / Wheat Sheaf Arch */}
            <path
              d="M20 50C20 33.4315 33.4315 20 50 20C66.5685 20 80 33.4315 80 50C80 66.5685 66.5685 80 50 80"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="4 3"
              opacity="0.6"
            />
            {/* Crown / Wheat accent at top */}
            <path
              d="M44 24L50 14L56 24M50 14V30"
              stroke="#F59E0B"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* "A-1" stylized emblem */}
            <text
              x="50%"
              y="58%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#FFFFFF"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="34"
              letterSpacing="-1"
            >
              A1
            </text>
            {/* Mini ribbon underline */}
            <path
              d="M32 72C42 75 58 75 68 72"
              stroke="#F59E0B"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        {/* Glow point */}
        <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
      </div>

      {/* Brand Typography */}
      {showText && variant !== "icon" && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-black tracking-tight text-foreground font-sans",
                currentSize.title
              )}
            >
              A-ONE
            </span>
            <span className="rounded bg-amber-500/15 px-1 py-0.5 text-[9px] font-bold tracking-wider text-amber-700 dark:text-amber-400">
              FOODS
            </span>
          </div>
          <span
            className={cn(
              "font-medium tracking-normal text-muted-foreground mt-0.5",
              currentSize.sub
            )}
          >
            AI Assistant
          </span>
        </div>
      )}
    </div>
  );
}
