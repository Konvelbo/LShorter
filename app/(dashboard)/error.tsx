"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-[14px] bg-[#141416] border border-[#27272a] p-6 sm:p-8 flex flex-col items-center text-center shadow-xl">
        <div className="w-12 h-12 rounded-full bg-brand-subtle text-brand flex items-center justify-center mb-4 border border-brand-subtle">
          <AlertCircle className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          Chargement du Dashboard Interrompu
        </h2>
        <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
          Une erreur temporaire est survenue lors de la synchronisation des données. Cliquez sur Réessayer pour recharger les widgets.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <Button
            onClick={() => reset()}
            variant="glow"
            className="w-full sm:flex-1 h-10 text-xs font-bold gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </Button>

          <Link href="/dashboard" className="w-full sm:flex-1">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full h-10 text-xs font-semibold gap-2 border-[#27272a] bg-[#1a1a1e] hover:bg-white/10 text-neutral-200"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-neutral-400" />
              <span>Recharger la page</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
