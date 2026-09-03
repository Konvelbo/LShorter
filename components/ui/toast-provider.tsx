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

      {/* Floating Toasts Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
        {toasts.map((t) => {
          let borderColor = "border-[#27272a]";
          let bgIcon = <Info className="w-4 h-4 text-sky-400 shrink-0" />;

          if (t.type === "success") {
            borderColor = "border-emerald-500/40";
            bgIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
          } else if (t.type === "error") {
            borderColor = "border-red-500/40";
            bgIcon = <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
          } else if (t.type === "upgrade") {
            borderColor = "border-[#ff6600]/50";
            bgIcon = <Sparkles className="w-4 h-4 text-[#ff6600] shrink-0" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-[12px] bg-[#141416]/95 backdrop-blur-xl border ${borderColor} shadow-2xl shadow-black/80 text-white transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in`}
            >
              <div className="mt-0.5">{bgIcon}</div>
              <div className="flex-1 min-w-0">
                {t.title && <h4 className="text-xs font-bold text-white mb-0.5">{t.title}</h4>}
                <p className="text-xs text-neutral-300 leading-snug">{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-neutral-500 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
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
