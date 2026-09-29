"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DrawerSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
}

export function DrawerSwitch({
  checked,
  onChange,
  disabled = false,
  "aria-label": ariaLabel,
  className,
}: DrawerSwitchProps) {
  return (
    <label
      className={cn(
        "relative inline-block w-[38px] h-[22px] shrink-0 select-none cursor-pointer",
        disabled && "opacity-40 cursor-not-allowed",
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={ariaLabel}
        className="sr-only"
      />
      <span
        className={cn(
          "absolute inset-0 rounded-full transition-colors duration-150",
          checked
            ? "bg-[#1d5fe0] dark:bg-[#3b82f6]"
            : "bg-[#e6e7ea] dark:bg-[#22242a]",
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white transition-transform duration-150 shadow-xs",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </span>
    </label>
  );
}
