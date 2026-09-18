"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

export function FieldErrorAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-[10px] px-2.5 py-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1">
      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
      <span className="font-medium leading-tight">{message}</span>
    </div>
  );
}
