import React from "react";
import Link from "next/link";
import { PauseCircle, ArrowLeft } from "lucide-react";

export default async function PausedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="min-h-screen w-full bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Glow Effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Paused Card */}
      <div className="w-full max-w-md rounded-[10px] bg-[#121215] border border-[#222226] p-8 shadow-2xl relative z-10 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-[10px] bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/10">
          <PauseCircle className="w-8 h-8 text-red-400" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a1a1e] border border-[#27272b] text-[11px] font-mono text-red-400 mb-3">
          <span>/{slug}</span>
        </div>

        <h1 className="text-xl font-bold text-white mb-2 tracking-tight">
          Lien Temporairement en Pause
        </h1>
        <p className="text-xs text-neutral-400 mb-6 max-w-xs mx-auto leading-relaxed">
          Ce lien court a été mis en pause par son propriétaire. Les redirections sont temporairement suspendues.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-[10px] bg-[#1c1c21] hover:bg-[#25252c] text-white font-semibold text-xs border border-[#2a2a30] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l&apos;accueil</span>
        </Link>

        <div className="mt-6 pt-6 border-t border-[#1e1e24] flex items-center justify-center text-[11px] text-neutral-500 gap-1.5">
          <span>Sécurisé par</span>
          <span className="font-semibold text-neutral-400">LShorter Edge</span>
        </div>
      </div>
    </div>
  );
}
