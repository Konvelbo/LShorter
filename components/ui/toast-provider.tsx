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
      const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
      gsap.to(cardRef.current, {
        opacity: 0,
        x: isDesktop ? 35 : 0,
        y: isDesktop ? 0 : -22,
        scale: 0.92,
        filter: "blur(4px)",
        duration: 0.28,
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
      const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
      gsap.fromTo(
        cardRef.current,
        {
          opacity: 0,
          x: isDesktop ? 40 : 0,
          y: isDesktop ? 0 : -28,
          scale: 0.9,
          filter: "blur(6px)",
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.42,
          ease: isDesktop ? "power3.out" : "back.out(1.4)",
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

  let iconBadge = (
    <div className="lshorter-toast-badge lshorter-toast-badge-info">
      <Info className="w-4 h-4 md:w-4.5 md:h-4.5 stroke-[2.5]" />
    </div>
  );

  if (toast.type === "success") {
    iconBadge = (
      <div className="lshorter-toast-badge lshorter-toast-badge-success">
        <Check className="w-4 h-4 md:w-4.5 md:h-4.5 stroke-[2.75]" />
      </div>
    );
  } else if (toast.type === "error") {
    iconBadge = (
      <div className="lshorter-toast-badge lshorter-toast-badge-error">
        <AlertCircle className="w-4 h-4 md:w-4.5 md:h-4.5 stroke-[2.5]" />
      </div>
    );
  } else if (toast.type === "upgrade") {
    iconBadge = (
      <div className="lshorter-toast-badge lshorter-toast-badge-upgrade">
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
      className={`lshorter-toast lshorter-toast-${toast.type} group`}
    >
      {/* Left Icon & Text Layout */}
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        {iconBadge}
        <div className="flex-1 min-w-0 pr-1">
          <div className="lshorter-toast-title">
            {toastTitle}
          </div>
          <div className="lshorter-toast-msg">
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
        className="lshorter-toast-close"
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

      {/* Floating Toasts Container (Top-center on Mobile, Bottom-right on Desktop with z-[99999]) */}
      <div className="fixed z-[99999] pointer-events-none select-none flex flex-col gap-2.5 top-4 left-1/2 -translate-x-1/2 w-full max-w-[330px] xs:max-w-[350px] items-center px-2.5 md:top-auto md:bottom-6 md:right-6 md:left-auto md:translate-x-0 md:items-end md:w-auto md:max-w-md md:px-0">
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
