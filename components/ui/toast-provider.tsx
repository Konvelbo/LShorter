"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X, Sparkles } from "lucide-react";

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
      duration = 4000,
    }: {
      type?: ToastType;
      title?: string;
      message: string;
      duration?: number;
    }) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
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

      {/* Top Dynamic Island Toasts Container (Mobile-First + Wide Desktop) */}
      <div className="fixed top-3.5 sm:top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2.5 w-[calc(100%-2rem)] md:w-auto max-w-sm md:max-w-xl lg:max-w-2xl pointer-events-none select-none">
        {toasts.map((t) => {
          let borderStyle = "border-white/10 shadow-black/80";
          let bgIcon = (
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0">
              <Info className="w-3 h-3 md:w-3.5 md:h-3.5 text-sky-400" />
            </div>
          );

          if (t.type === "success") {
            borderStyle = "border-emerald-500/40 shadow-emerald-950/30";
            bgIcon = (
              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-400" />
              </div>
            );
          } else if (t.type === "error") {
            borderStyle = "border-rose-500/40 shadow-rose-950/30";
            bgIcon = (
              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertCircle className="w-3 h-3 md:w-3.5 md:h-3.5 text-rose-400" />
              </div>
            );
          } else if (t.type === "upgrade") {
            borderStyle = "border-[#ff6600]/40 shadow-[#ff6600]/30";
            bgIcon = (
              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#ff6600]/20 border border-[#ff6600]/40 flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#ff6600]" />
              </div>
            );
          }

          return (
            <div
              key={t.id}
              onClick={() => removeToast(t.id)}
              className={`pointer-events-auto flex items-center gap-3 px-3.5 sm:px-5 py-2 sm:py-3 rounded-full bg-[#0d0d12]/95 backdrop-blur-2xl border ${borderStyle} shadow-[0_12px_40px_rgba(0,0,0,0.85)] text-white transition-all duration-300 animate-in slide-in-from-top-3 fade-in cursor-pointer active:scale-98 w-full md:w-auto md:min-w-[420px] lg:min-w-[480px] justify-between`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {bgIcon}
                <div className="flex-1 min-w-0 pr-1">
                  {t.title && <span className="text-[11.5px] md:text-xs font-bold text-white mr-1.5 tracking-tight">{t.title} ·</span>}
                  <span className="text-xs md:text-[13px] text-neutral-100 font-medium leading-tight">{t.message}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(t.id);
                }}
                className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all shrink-0 cursor-pointer ml-2"
                aria-label="Fermer"
              >
                <X className="w-3 h-3 md:w-3.5 md:h-3.5" />
              </button>
            </div>
          );
        })}
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
