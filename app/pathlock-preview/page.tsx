"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Shield,
  ShieldAlert,
  Lock,
  RefreshCw,
  ExternalLink,
  ChevronUp,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";

function PathLockPreviewContent() {
  const searchParams = useSearchParams();
  const showTop = searchParams.get("top") !== "0";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative w-screen h-screen bg-[#0B0C0E] overflow-hidden font-sans select-none text-[#F5F6F8]">
      {/* ── TOPBAR (AVEC LE TOP) ── */}
      {showTop && (
        <header className="fixed top-0 left-0 right-0 z-[100] h-16 sm:h-20 px-6 sm:px-12 flex items-center justify-between box-border border-b border-white/[0.08] bg-[#0B0C0E]/95 backdrop-blur-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          {/* Left Brand & Mode */}
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="w-10 h-10 rounded-[12px] bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-600/30">
              <Shield className="w-5 h-5" />
            </span>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold text-white tracking-[-0.01em]">
                Acme SaaS — /app/dashboard
              </span>
              <span className="text-[11px] text-[#8DB0FF] font-medium font-mono">
                lsho.cc/demo-saas
              </span>
            </div>

            <span className="ml-2 inline-flex items-center h-7 px-3 rounded-full bg-blue-600/10 border border-blue-500/30 text-[#A9C4FF] text-xs font-semibold whitespace-nowrap">
              PathLock™ Funnel
            </span>
            <span className="inline-flex items-center h-7 px-3 rounded-full bg-white/[0.05] border border-white/10 text-emerald-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
              Verrouillage actif
            </span>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              className="h-10 px-4 inline-flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.04] text-[#D5D9E2] text-xs font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualiser</span>
            </button>
            <button
              type="button"
              className="h-10 px-4 inline-flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.04] text-[#D5D9E2] text-xs font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Original</span>
            </button>
            <button
              type="button"
              className="w-10 h-10 inline-flex items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.04] text-[#D5D9E2]"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* ── BACKGROUND CONTENT PREVIEW (Simulating underlying Web App behind glassmorphism) ── */}
      <div
        className={`absolute inset-0 w-full h-full bg-[#0B0C0E] overflow-hidden flex flex-col ${
          showTop ? "pt-20" : ""
        }`}
      >
        {/* Subtle grid and decorative background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,102,255,0.15),rgba(255,255,255,0))]" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/[0.06] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/[0.05] rounded-full blur-[160px] pointer-events-none" />

        {/* Mock dashboard background lines (blurred behind overlay) */}
        <div className="w-full max-w-6xl mx-auto mt-12 p-8 opacity-25 filter blur-[6px] pointer-events-none">
          <div className="h-12 w-64 bg-white/10 rounded-xl mb-8" />
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="h-28 bg-white/10 rounded-2xl" />
            <div className="h-28 bg-white/10 rounded-2xl" />
            <div className="h-28 bg-white/10 rounded-2xl" />
            <div className="h-28 bg-white/10 rounded-2xl" />
          </div>
          <div className="h-96 bg-white/10 rounded-3xl" />
        </div>
      </div>

      {/* ── PATHLOCK™ SECURITY GATE BLOCKING OVERLAY ── */}
      <div
        className={`fixed inset-0 z-50 bg-[#0B0C0E]/75 backdrop-blur-[24px] flex flex-col items-center justify-center p-6 text-white font-sans ${
          showTop ? "pt-24" : ""
        }`}
      >
        {/* Ambient Glows */}
        <div className="absolute left-[30%] top-[25%] w-[560px] h-[560px] rounded-full bg-blue-600/[0.12] blur-[140px] pointer-events-none" />
        <div className="absolute right-[25%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-indigo-600/[0.1] blur-[120px] pointer-events-none" />

        {/* Centered Modal Card */}
        <div className="relative z-10 w-full max-w-[500px] sm:max-w-[530px] flex flex-col items-center">
          <div className="w-full box-border rounded-[28px] flex flex-col items-center text-center p-8 sm:p-10 bg-[#111216]/95 border border-white/[0.14] shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-[36px] animate-in fade-in zoom-in-95 duration-300">
            {/* Shield Alert Icon Badge */}
            <span className="w-16 h-16 rounded-2xl bg-blue-600/[0.16] border border-[#608CFF]/[0.4] text-[#8DB0FF] flex items-center justify-center shrink-0 shadow-xl shadow-blue-600/20 mb-5">
              <ShieldAlert className="w-8 h-8" />
            </span>

            {/* Status Tag Pill */}
            <span className="inline-flex items-center gap-1.5 h-7 px-3.5 rounded-full bg-blue-600/[0.14] border border-[#608CFF]/[0.35] text-[#A9C4FF] text-[11px] font-bold tracking-[0.06em] uppercase mb-3.5">
              <Lock className="w-3.5 h-3.5" />
              <span>ACCÈS HORS PÉRIMÈTRE BLOQUÉ</span>
            </span>

            {/* Main Heading */}
            <h1 className="text-2xl sm:text-[26px] leading-tight font-bold tracking-tight text-white mb-2">
              Navigation restreinte par le créateur du lien
            </h1>

            {/* Link Name */}
            <p className="text-sm sm:text-[15px] font-semibold text-[#8DB0FF] mb-3">
              Acme SaaS — Early Access Portal
            </p>

            {/* Description Box */}
            <div className="w-full p-4 rounded-xl bg-white/[0.04] border border-white/10 text-center mb-4">
              <p className="text-xs sm:text-[13.5px] text-[#D5D9E2] leading-relaxed">
                Le propriétaire de ce lien a restreint l'accès aux seules pages de son périmètre autorisé. Toute navigation externe ou non autorisée est verrouillée par PathLock™.
              </p>
            </div>

            {/* Authorized Perimeter Box */}
            <div className="w-full box-border h-12 px-4 flex items-center justify-center gap-2.5 rounded-xl bg-white/[0.04] border border-white/10 mb-5">
              <span className="text-xs sm:text-sm text-[#A9AFBA]">Périmètre autorisé :</span>
              <code className="font-mono text-xs sm:text-sm font-semibold text-[#A9C4FF] px-2.5 py-1 rounded-lg bg-black/50 border border-white/10">
                /app/dashboard/*
              </code>
            </div>

            {/* Return Button */}
            <button
              type="button"
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-sm sm:text-[15px] font-semibold transition-all shadow-lg shadow-blue-600/30 cursor-pointer mb-5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Revenir à la page autorisée</span>
            </button>

            {/* Divider Line */}
            <div className="w-full h-px bg-white/10 mb-5" />

            {/* Developer / Team Unlock Form */}
            <div className="w-full flex flex-col gap-3 text-left">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white">
                  <Lock className="w-3.5 h-3.5 text-[#8DB0FF]" />
                  <span>Déverrouillage équipe / dev</span>
                </span>
                <span className="text-[11px] font-medium text-[#A9AFBA]">
                  Accès complet
                </span>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mot de passe de déblocage…"
                  value="••••••••••••"
                  readOnly
                  className="w-full h-11 px-3.5 pr-11 rounded-[10px] bg-black/40 border border-white/[0.16] text-[#F5F6F8] placeholder:text-[#8A909C] text-xs sm:text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1 w-9 h-9 flex items-center justify-center text-[#A9AFBA] hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="button"
                className="w-full h-11 rounded-[10px] border border-[#8DB0FF]/40 hover:bg-white/[0.06] text-[#A9C4FF] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Déverrouiller l’accès complet
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-xs text-[#9096A3] text-center tracking-wide">
            Sécurisé par LShorter Edge Gate • PathLock™ Engine
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PathLockPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0C0E]" />}>
      <PathLockPreviewContent />
    </Suspense>
  );
}
