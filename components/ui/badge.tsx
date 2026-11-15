import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[10px] px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--brand-primary)] text-white border-transparent",
        active:
          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
        expire:
          "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
        inactive:
          "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30",
        orange:
          "bg-[var(--badge-brand-bg)] text-[var(--badge-brand-text)] border border-[var(--badge-brand-border)]",
        blue:
          "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30",
        purple:
          "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30",
        secondary:
          "bg-neutral-100 dark:bg-[#27272a] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700",
        outline:
          "bg-transparent text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-[#27272a]",
        destructive:
          "border-transparent bg-red-500 text-white hover:bg-red-600",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant = "secondary", ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { badgeVariants };
