"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { Check, AlertCircle, Info, X, Sparkles } from "lucide-react";
import gsap from "gsap";

export type ToastType = "success" | "error" | "info" | "upgrade";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: { type?: ToastType; title?: string; message: string; duration?: number }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  upgrade: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let globalToastHandler: ((options: { type?: ToastType; title?: string; message: string; duration?: number }) => void) | null = null;

export const showToast = {
  success: (message: string, title?: string) => globalToastHandler?.({ type: "success", message, title }),
  error: (message: string, title?: string) => globalToastHandler?.({ type: "error", message, title }),
  info: (message: string, title?: string) => globalToastHandler?.({ type: "info", message, title }),
  upgrade: (message: string, title?: string) => globalToastHandler?.({ type: "upgrade", message, title }),
};

const playNotificationSound = () => {
  try {
    const audio = new Audio("/Notification.mp3");
    audio.volume = 0.55;
    audio.play().catch(() => {
      // Autoplay or gesture restriction fallback
    });
  } catch {
    // Ignore audio error
  }
};

// ─── Animated GSAP Toast Item Card ──────────────────────────────────────────
function AnimatedToastCard({
  toast,
  onRemove,
}: {
  toast: ToastItem;
  onRemove: (id: string) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef(false);

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    if (cardRef.current) {
      gsap.to(cardRef.current, {
        opacity: 0,
        y: -22,
        scale: 0.92,
        filter: "blur(4px)",
        duration: 0.32,
        ease: "power2.inOut",
        onComplete: () => {
          onRemove(toast.id);
        },
      });
    } else {
      onRemove(toast.id);
    }
  }, [onRemove, toast.id]);

  // Entrance Animation with GSAP
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        {
          opacity: 0,
          y: -28,
          scale: 0.88,
          filter: "blur(6px)",
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.45,
          ease: "back.out(1.4)",
        }
      );
    }

    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [handleClose, toast.duration]);

  let borderStyle = "border-[#27272a] shadow-black/80";
  let iconBadge = (
    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-sky-500/80 bg-sky-500/10 flex items-center justify-center shrink-0 text-sky-400">
      <Info className="w-4 h-4 md:w-4.5 md:h-4.5 stroke-[2.5]" />
    </div>
  );

  if (toast.type === "success") {
    borderStyle = "border-emerald-500/35 shadow-emerald-950/20";
    iconBadge = (
      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-emerald-500/85 bg-emerald-500/15 flex items-center justify-center shrink-0 text-emerald-400">
        <Check className="w-4 h-4 md:w-4.5 md:h-4.5 stroke-[2.75]" />
      </div>
    );
  } else if (toast.type === "error") {
    borderStyle = "border-rose-500/35 shadow-rose-950/20";
    iconBadge = (
      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-rose-500/85 bg-rose-500/15 flex items-center justify-center shrink-0 text-rose-400">
        <AlertCircle className="w-4 h-4 md:w-4.5 md:h-4.5 stroke-[2.5]" />
      </div>
    );
  } else if (toast.type === "upgrade") {
    borderStyle = "border-[#ff6600]/35 shadow-[#ff6600]/20";
    iconBadge = (
      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-[#ff6600]/85 bg-[#ff6600]/15 flex items-center justify-center shrink-0 text-[#ff6600]">
        <Sparkles className="w-4 h-4 md:w-4.5 md:h-4.5 stroke-[2.5]" />
      </div>
    );
  }

  const getDefaultTitle = (type: ToastType) => {
    switch (type) {
      case "success":
        return "Succès";
      case "error":
        return "Erreur";
      case "upgrade":
        return "Plan PRO";
      default:
        return "Notification";
    }
  };

  const toastTitle = toast.title || getDefaultTitle(toast.type);

  return (
    <div
      ref={cardRef}
      onClick={handleClose}
      className={`pointer-events-auto flex items-start sm:items-center gap-3 px-3.5 py-2.5 sm:px-4.5 sm:py-3.5 rounded-[12px] md:rounded-[14px] bg-[#121316]/98 backdrop-blur-2xl border ${borderStyle} shadow-[0_12px_36px_rgba(0,0,0,0.85)] text-white cursor-pointer active:scale-98 w-full md:min-w-[420px] lg:min-w-[480px] justify-between will-change-transform`}
    >
      {/* Left Circular Icon & Text Layout */}
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        {iconBadge}
        <div className="flex-1 min-w-0 pr-1">
          <div className="text-xs sm:text-[13px] font-semibold text-white tracking-tight leading-tight">
            {toastTitle}
          </div>
          <div className="text-[11px] sm:text-xs text-neutral-300/90 font-normal leading-snug mt-0.5 break-words">
            {toast.message}
          </div>
        </div>
      </div>

      {/* Right Close Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        className="w-5 h-5 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors shrink-0 cursor-pointer -mr-0.5 mt-0.5 sm:mt-0"
        aria-label="Fermer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({
      type = "info",
      title,
      message,
      duration = 4500,
    }: {
      type?: ToastType;
      title?: string;
      message: string;
      duration?: number;
    }) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      playNotificationSound();

      setToasts((prev) => [...prev.slice(-3), newToast]); // keep max 4 toasts
    },
    []
  );

  useEffect(() => {
    globalToastHandler = addToast;
    return () => {
      globalToastHandler = null;
    };
  }, [addToast]);

  const value: ToastContextType = {
    toast: addToast,
    success: (message, title) => addToast({ type: "success", message, title }),
    error: (message, title) => addToast({ type: "error", message, title }),
    info: (message, title) => addToast({ type: "info", message, title }),
    upgrade: (message, title) => addToast({ type: "upgrade", message, title }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Top Floating Toasts Container (Above Topbar with z-[99999], Compact on Mobile & Wide on Desktop) */}
      <div className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center gap-2.5 w-full max-w-[330px] xs:max-w-[350px] md:max-w-xl lg:max-w-2xl px-2.5 pointer-events-none select-none">
        {toasts.map((t) => (
          <AnimatedToastCard key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: showToast.info,
      success: showToast.success,
      error: showToast.error,
      info: showToast.info,
      upgrade: showToast.upgrade,
    };
  }
  return context;
}
