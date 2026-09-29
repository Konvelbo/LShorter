import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "glow";
  size?: "sm" | "md" | "lg" | "icon" | "icon-sm" | "icon-xs" | "default";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-border)] disabled:opacity-50 disabled:pointer-events-none rounded-[10px] select-none cursor-pointer";

    const variants = {
      primary:
        "bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] shadow-[var(--btn-primary-shadow)] text-[var(--btn-primary-text)] active:scale-[0.98] shadow-md font-semibold",
      glow:
        "bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] shadow-[var(--btn-primary-shadow)] text-[var(--btn-primary-text)] active:scale-[0.98] shadow-lg font-semibold",
      secondary:
        "bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 dark:border-transparent dark:bg-[#27272a] dark:text-white dark:hover:bg-[#3f3f46] active:scale-[0.98]",
      outline:
        "border border-slate-300 dark:border-[#27272a] bg-white dark:bg-transparent text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-white/5 hover:border-slate-400 dark:hover:border-neutral-600 active:scale-[0.98]",
      ghost:
        "bg-transparent text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white",
      destructive:
        "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-[0.98]"
    };

    const sizes = {
      default: "h-10 px-4 text-sm gap-2",
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5 font-medium",
      icon: "h-10 w-10 p-0 shrink-0",
      "icon-sm": "h-8 w-8 p-0 shrink-0",
      "icon-xs": "h-7 w-7 p-0 shrink-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
