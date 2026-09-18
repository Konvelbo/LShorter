"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Next.js App Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#09090b] text-[#fafafa] p-4">
      <div className="max-w-md w-full rounded-[14px] bg-[#141416] border border-[#27272a] p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h1 className="font-bebas text-2xl tracking-wide text-white mb-2">
          A temporary error occurred
        </h1>
        <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
          There was an issue loading this section. You can retry immediately or return to the dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <Button
            onClick={() => reset()}
            variant="glow"
            className="w-full sm:flex-1 h-10 text-xs font-bold gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </Button>

          <Link href="/dashboard" className="w-full sm:flex-1">
            <Button
              variant="outline"
              className="w-full h-10 text-xs font-semibold gap-2 border-[#27272a] bg-[#1a1a1e] hover:bg-white/10 text-neutral-200"
            >
              <Home className="w-3.5 h-3.5 text-neutral-400" />
              <span>Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
