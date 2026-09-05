import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "active" | "expire" | "inactive" | "orange" | "blue" | "purple" | "secondary" | "outline";
}

export function Badge({ className, variant = "secondary", children, ...props }: BadgeProps) {
  const variants = {
    active: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    expire: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    inactive: "bg-red-500/15 text-red-400 border border-red-500/30",
    orange: "bg-[#ff6600]/15 text-[#ff6600] border border-[#ff6600]/30",
    blue: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
    purple: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
    secondary: "bg-[#27272a] text-neutral-300 border border-neutral-700",
    outline: "bg-transparent text-neutral-300 border border-[#27272a]"
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-[10px] px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
