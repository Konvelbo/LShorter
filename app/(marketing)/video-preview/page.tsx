'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { LShorterPromo, TOTAL_VIDEO_FRAMES } from '@/remotion/Video';

// Dynamic import for Remotion Player to avoid SSR issues
const Player = dynamic(() => import('@remotion/player').then((mod) => mod.Player), {
  ssr: false,
});

export default function VideoPreviewPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-start py-12 px-4 sm:px-6">
      {/* Top Navigation */}
      <div className="w-full max-w-6xl flex items-center justify-between mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
          <Sparkles className="w-3.5 h-3.5" />
          Remotion 4K Preview Studio (Avec Audio & Vraies Captures)
        </div>
      </div>

      {/* Main Header */}
      <div className="w-full max-w-6xl text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
          LShorter — Vidéo de Lancement Twitter / SaaS
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          Avec les vraies captures du dashboard, Smart Routing, QR Studio, Télémétrie 2.4 ms, caméra fluide et bande son originale.
        </p>
      </div>

      {/* Video Player Card */}
      <div className="w-full max-w-6xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/10 bg-slate-900/80 backdrop-blur-xl p-2 sm:p-4 mb-8">
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-black relative">
          <Player
            component={LShorterPromo}
            durationInFrames={TOTAL_VIDEO_FRAMES}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={30}
            controls
            autoPlay={false}
            loop
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </div>
      </div>

      {/* Timeline Scenes Guide */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm text-slate-300">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
          <div className="font-semibold text-blue-400 mb-1">00:00 - 00:15 (Hook, Brand & Dashboard)</div>
          <p className="text-slate-400">Le problème des redirections muettes ➔ Logo pulsant ➔ Vraie capture du dashboard et clic sur Nouveau Lien.</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
          <div className="font-semibold text-cyan-400 mb-1">00:15 - 00:32 (Features Phares Réelles)</div>
          <p className="text-slate-400">Drawer de création ➔ Smart Routing (France + Mobile) ➔ QR Studio avec export SVG ➔ Sécurité PathLock™.</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
          <div className="font-semibold text-emerald-400 mb-1">00:32 - 00:46 (Télémétrie, Revenus & Outro)</div>
          <p className="text-slate-400">Stream 2.4 ms ➔ Graphique de revenus réels (€12,480) ➔ Carte mondiale ➔ Clic final CTA.</p>
        </div>
      </div>
    </div>
  );
}
