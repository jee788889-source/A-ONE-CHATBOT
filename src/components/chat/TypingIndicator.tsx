import React from "react";

export function TypingIndicator() {
  return (
    <div className="flex w-fit items-center gap-2.5 rounded-2xl rounded-tl-xs bg-card border border-stone-200/80 dark:border-stone-800/80 px-4 py-2.5 shadow-xs text-xs text-muted-foreground animate-in fade-in duration-200">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 rounded-full bg-primary/80 animate-bounce"
            style={{ animationDelay: `${i * 0.16}s`, animationDuration: "0.8s" }}
          />
        ))}
      </div>
      <span className="font-medium">A-ONE AI is thinking...</span>
    </div>
  );
}
