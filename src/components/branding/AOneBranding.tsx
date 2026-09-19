import { cn } from "@/lib/utils";

/**
 * A-ONE Restaurant Branding Component.
 */
export function AOneBranding({
  className,
}: {
  className?: string;
  variant?: "line" | "stacked";
}) {
  return (
    <div className={cn("inline-flex items-center gap-2 text-xs text-neutral-400", className)}>
      <img
        src="/assets/images/logo-3d.png"
        alt="A-ONE Restaurant"
        className="h-4 w-8 object-contain rounded-sm"
      />
      <span>A-ONE Restaurant Operations</span>
    </div>
  );
}
