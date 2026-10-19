"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerContextType {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  direction?: "left" | "right" | "top" | "bottom";
}

const DrawerContext = createContext<DrawerContextType | null>(null);

export function useDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) {
    throw new Error("useDrawer must be used within a <Drawer>");
  }
  return ctx;
}

export interface DrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  direction?: "left" | "right" | "top" | "bottom";
  swipeDirection?: "left" | "right" | "top" | "bottom";
  children: React.ReactNode;
}

export function Drawer({
  open,
  onOpenChange,
  direction = "right",
  swipeDirection,
  children,
}: DrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const effectiveDirection = swipeDirection || direction;

  const openDrawer = () => {
    if (!isControlled) setInternalOpen(true);
    onOpenChange?.(true);
  };

  const closeDrawer = () => {
    if (!isControlled) setInternalOpen(false);
    onOpenChange?.(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  return (
    <DrawerContext.Provider
      value={{
        isOpen,
        openDrawer,
        closeDrawer,
        direction: effectiveDirection,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
}

export function DrawerTrigger({
  render,
  children,
  className,
  ...props
}: {
  render?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  const { openDrawer } = useDrawer();

  if (render && React.isValidElement(render)) {
    return React.cloneElement(render as React.ReactElement<any>, {
      onClick: (e: any) => {
        (render as any).props?.onClick?.(e);
        openDrawer();
      },
    });
  }

  return (
    <button
      type="button"
      onClick={openDrawer}
      className={cn("cursor-pointer", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function DrawerContent({
  children,
  className,
  widthClass,
  direction: propDirection,
}: {
  children: React.ReactNode;
  className?: string;
  widthClass?: string;
  direction?: "left" | "right" | "top" | "bottom";
}) {
  const { isOpen, closeDrawer, direction: contextDirection = "right" } = useDrawer();
  const direction = propDirection || contextDirection;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isBottom = direction === "bottom";
  const isTop = direction === "top";
  const isLeft = direction === "left";

  const defaultWidth = isBottom || isTop
    ? "w-full"
    : widthClass || "w-full sm:max-w-[500px]";

  const positionClasses = isBottom
    ? "fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col bg-white dark:bg-[#141416] border-t border-zinc-200 dark:border-[#27272a] rounded-t-[10px] shadow-2xl transition-transform duration-300 ease-out"
    : isTop
    ? "fixed inset-x-0 top-0 z-50 flex max-h-[88vh] flex-col bg-white dark:bg-[#141416] border-b border-zinc-200 dark:border-[#27272a] rounded-b-[10px] shadow-2xl transition-transform duration-300 ease-out"
    : isLeft
    ? "fixed inset-y-0 left-0 z-50 flex h-full flex-col bg-white dark:bg-[#141416] border-r border-zinc-200 dark:border-[#27272a] shadow-2xl transition-transform duration-300 ease-out"
    : "fixed inset-y-0 right-0 z-50 flex h-full flex-col bg-white dark:bg-[#141416] border-l border-zinc-200 dark:border-[#27272a] shadow-2xl transition-transform duration-300 ease-out";

  const transformClass = isBottom
    ? (isOpen ? "translate-y-0" : "translate-y-full")
    : isTop
    ? (isOpen ? "translate-y-0" : "-translate-y-full")
    : isLeft
    ? (isOpen ? "translate-x-0" : "-translate-x-full")
    : (isOpen ? "translate-x-0" : "translate-x-full");

  if (!mounted) return null;

  return (
    <div
      inert={!isOpen ? true : undefined}
      className={cn(
        "fixed inset-0 z-50 transition-opacity duration-300 overflow-hidden",
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
    >
      {/* Backdrop overlay */}
      <div
        onClick={closeDrawer}
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Drawer sliding panel */}
      <div
        className={cn(positionClasses, defaultWidth, transformClass, className)}
      >
        {isBottom && (
          <div className="pt-2 pb-1 flex justify-center shrink-0">
            <div className="w-10 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function DrawerHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col border-b border-neutral-200 dark:border-[#222225] bg-white dark:bg-[#141416] px-5 py-4 shrink-0 sticky top-0 z-10",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DrawerTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      className={cn("text-base font-bold text-neutral-900 dark:text-white tracking-tight", className)}
    >
      {children}
    </h2>
  );
}

export function DrawerDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("text-xs text-neutral-500 dark:text-neutral-400 mt-0.5", className)}>
      {children}
    </p>
  );
}

export function DrawerFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2.5 border-t border-neutral-200 dark:border-[#222225] bg-white dark:bg-[#141416] px-5 py-3.5 shrink-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DrawerClose({
  render,
  children,
  className,
  ...props
}: {
  render?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  const { closeDrawer } = useDrawer();

  if (render && React.isValidElement(render)) {
    return React.cloneElement(render as React.ReactElement<any>, {
      onClick: (e: any) => {
        (render as any).props?.onClick?.(e);
        closeDrawer();
      },
    });
  }

  return (
    <button
      type="button"
      onClick={closeDrawer}
      className={cn(
        "w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer",
        className,
      )}
      {...props}
    >
      {children || <X className="w-4 h-4" />}
    </button>
  );
}
