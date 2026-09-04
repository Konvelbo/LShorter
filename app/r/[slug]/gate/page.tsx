"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  Loader2,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PasswordGatePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockedTargetUrl, setUnlockedTargetUrl] = useState<string | null>(null);
  const [isCloaked, setIsCloaked] = useState(false);
  const [metaTitle, setMetaTitle] = useState<string | null>(null);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setPasswordError("Veuillez saisir le mot de passe.");
      return;
    }

    setIsVerifying(true);
    setPasswordError(null);

    try {
      const res = await fetch(`/api/r/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setPasswordError(data.error || "Mot de passe incorrect.");
        setIsVerifying(false);
        return;
      }

      setIsUnlocked(true);
      setUnlockedTargetUrl(data.targetUrl);
      setIsCloaked(Boolean(data.isCloaked));
      setMetaTitle(data.metaTitle);
      setIsVerifying(false);

      if (!data.isCloaked && data.targetUrl) {
        window.location.replace(data.targetUrl);
      }
    } catch (err: any) {
      setPasswordError("Erreur de communication avec le serveur.");
      setIsVerifying(false);
    }
  };

  // If unlocked and cloaked, display inside full iframe
  if (isUnlocked && isCloaked && unlockedTargetUrl) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#0d0d10] flex flex-col z-[9999]">
        <div className="h-10 bg-[#16161a] border-b border-[#26262a] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-white font-medium">/{slug}</span>
            <span className="text-neutral-600">•</span>
            <span className="truncate max-w-xs">{metaTitle || slug}</span>
          </div>
          <a
            href={unlockedTargetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#ff6600] hover:underline"
          >
            <span>Ouvrir la source</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <iframe
          src={unlockedTargetUrl}
          title={metaTitle || slug}
          className="w-full flex-1 border-0 bg-white"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#ff6600]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Gate Card */}
      <div className="w-full max-w-md rounded-[10px] bg-[#121215] border border-[#222226] p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-[10px] bg-gradient-to-br from-[#ff6600]/20 to-amber-500/10 border border-[#ff6600]/30 flex items-center justify-center mb-6 shadow-lg shadow-[#ff6600]/10">
            <Lock className="w-8 h-8 text-[#ff6600]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a1a1e] border border-[#27272b] text-[11px] font-mono text-[#ff6600] mb-3">
            <span>/{slug}</span>
          </div>

          <h1 className="text-xl font-bold text-white mb-2 tracking-tight">
            Lien Protégé par Mot de Passe
          </h1>
          <p className="text-xs text-neutral-400 mb-6 max-w-xs leading-relaxed">
            L&apos;auteur a sécurisé ce lien court. Entrez le mot de passe requis pour déverrouiller la destination.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Mot de passe d&apos;accès
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="Entrez le mot de passe..."
                autoFocus
                className={`w-full px-4 py-3 rounded-[10px] bg-[#1a1a1e] border text-sm text-white placeholder-neutral-500 transition-all outline-none pr-11 ${
                  passwordError
                    ? "border-red-500/80 focus:border-red-500 ring-2 ring-red-500/20"
                    : "border-[#2a2a30] focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer p-1"
                aria-label={showPassword ? "Masquer" : "Afficher"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {passwordError && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-red-400 animate-in fade-in duration-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isVerifying || !password.trim()}
            className="w-full h-11 rounded-[10px] bg-gradient-to-r from-[#ff6600] to-[#ff7700] hover:from-[#ff7711] hover:to-[#ff8811] text-white font-semibold text-sm shadow-lg shadow-[#ff6600]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Vérification...</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>Accéder au lien</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#1e1e24] flex items-center justify-center text-[11px] text-neutral-500 gap-1.5">
          <span>Sécurisé par</span>
          <span className="font-semibold text-neutral-400">LShorter Edge Gate</span>
        </div>
      </div>
    </div>
  );
}
