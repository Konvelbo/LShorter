"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextType {
  openItems: string[];
  toggleItem: (value: string) => void;
  isMulti?: boolean;
}

const AccordionContext = React.createContext<AccordionContextType | undefined>(undefined);

export function Accordion({
  children,
  className,
  type = "single",
  defaultValue,
}: {
  children: React.ReactNode;
  className?: string;
  type?: "single" | "multiple";
  defaultValue?: string | string[];
}) {
  const [openItems, setOpenItems] = React.useState<string[]>(() => {
    if (!defaultValue) return [];
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  });

  const toggleItem = React.useCallback(
    (value: string) => {
      setOpenItems((prev) => {
        if (type === "single") {
          return prev.includes(value) ? [] : [value];
        } else {
          return prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value];
        }
      });
    },
    [type]
  );

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, isMulti: type === "multiple" }}>
      <div className={cn("divide-y divide-neutral-200 dark:divide-white/10", className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

const AccordionItemContext = React.createContext<{ value: string; isOpen: boolean }>({
  value: "",
  isOpen: false,
});

export function AccordionItem({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(AccordionContext);
  const isOpen = ctx ? ctx.openItems.includes(value) : false;

  return (
    <AccordionItemContext.Provider value={{ value, isOpen }}>
      <div
        data-state={isOpen ? "open" : "closed"}
        className={cn("py-2 transition-colors", className)}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const itemCtx = React.useContext(AccordionItemContext);
  const ctx = React.useContext(AccordionContext);

  const handleClick = () => {
    if (ctx && itemCtx.value) {
      ctx.toggleItem(itemCtx.value);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-expanded={itemCtx.isOpen}
      className={cn(
        "flex w-full items-center justify-between py-4 text-left font-medium transition-all hover:text-neutral-900 dark:hover:text-white cursor-pointer select-none group",
        className
      )}
    >
      <span className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-[#0080ff] sm:group-hover:text-[#ff6600] dark:group-hover:text-[#0080ff] sm:dark:group-hover:text-[#ff6600] transition-colors">
        {children}
      </span>
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-300 dark:text-neutral-400 group-hover:text-[#0080ff] sm:group-hover:text-[#ff6600]",
          itemCtx.isOpen && "rotate-180 text-[#0080ff] sm:text-[#ff6600]"
        )}
      />
    </button>
  );
}

export function AccordionContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const itemCtx = React.useContext(AccordionItemContext);

  if (!itemCtx.isOpen) return null;

  return (
    <div
      className={cn(
        "overflow-hidden pb-4 pt-1 text-sm sm:text-base leading-relaxed text-neutral-600 dark:text-neutral-400 animate-in fade-in-50 duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}
