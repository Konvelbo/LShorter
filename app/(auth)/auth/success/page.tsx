"use client";

import React, { useEffect } from "react";
import { CheckCircle2, ArrowLeft, X } from "lucide-react";

export default function AuthSuccessPage() {
  useEffect(() => {
    // 1. Notify opener window if opened in a popup
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: "LSHORTER_AUTH_SUCCESS" }, "*");
      }
    } catch {
      // Cross-origin fallback
    }

    // 2. BroadcastChannel to notify all tabs on same origin
    try {
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("lshorter_auth");
        channel.postMessage("AUTH_SUCCESS");
      }
    } catch {
      // Ignore
    }

    // 3. LocalStorage event as fallback for other tabs
    try {
      localStorage.setItem("lshorter_auth_event", Date.now().toString());
    } catch {
      // Ignore
    }
  }, []);

  const handleCloseTab = () => {
    try {
      window.close();
    } catch {
      // Ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex items-center justify-center p-6 selection:bg-[#ff6600] selection:text-white">
      <div className="w-full max-w-md rounded-[18px] bg-[#141416] border border-[#27272a] p-8 shadow-2xl text-center flex flex-col items-center gap-6 animate-in fade-in zoom-in-95">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10 animate-bounce" />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2">
          <div className="inline-block mx-auto px-3 py-1 rounded-full bg-[#ff6600]/10 border border-[#ff6600]/30 text-[#ff6600] text-[11px] font-bold uppercase tracking-wider">
            Authentification Validée
          </div>
          <h1 className="font-bebas text-3xl sm:text-4xl text-white tracking-wide mt-1">
            CONNEXION RÉUSSIE ! 🎉
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-xs mx-auto">
            Votre compte est connecté avec succès. Vous pouvez fermer cet onglet et revenir sur votre page principale.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleCloseTab}
          className="w-full h-12 rounded-[10px] bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#ff6600]/30 flex items-center justify-center gap-2 cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Fermer cet onglet</span>
        </button>

        <p className="text-[11px] text-neutral-500 flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5 text-[#ff6600]" />
          <span>Votre session est automatiquement active sur votre premier onglet.</span>
        </p>
      </div>
    </div>
  );
}
