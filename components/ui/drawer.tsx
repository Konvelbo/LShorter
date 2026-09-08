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
  widthClass = "w-full sm:max-w-[560px]",
}: {
  children: React.ReactNode;
  className?: string;
  widthClass?: string;
}) {
  const { isOpen, closeDrawer, direction } = useDrawer();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        onClick={closeDrawer}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      />

      {/* Drawer sliding panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-full flex-col bg-[#141416] border-l border-[#27272a] shadow-2xl transition-transform duration-300 ease-out animate-in slide-in-from-right",
          widthClass,
          className
        )}
      >
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
        "flex flex-col border-b border-[#222225] bg-[#141416] px-5 py-4 shrink-0 sticky top-0 z-10",
        className
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
    <h2 className={cn("text-base font-bold text-white tracking-tight", className)}>
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
    <p className={cn("text-xs text-neutral-400 mt-0.5", className)}>
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
        "flex items-center justify-end gap-2.5 border-t border-[#222225] bg-[#141416] px-5 py-3.5 shrink-0",
        className
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
        "w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer",
        className
      )}
      {...props}
    >
      {children || <X className="w-4 h-4" />}
    </button>
  );
}
