"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, Shield, X, Loader2 } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast-provider";
import { cfCreateApiKey } from "@/lib/cloudflare-api";
import { ApiKeyItem } from "@/types";
import { getPlanLimits } from "@/lib/plan-guard";
import confetti from "canvas-confetti";

interface ApiKeyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (key: ApiKeyItem) => void;
  userId?: string;
  userPlan?: string;
  userEmail?: string;
}

export function ApiKeyDrawer({
  isOpen,
  onClose,
  onCreated,
  userId,
  userPlan = "FREE",
  userEmail,
}: ApiKeyDrawerProps) {
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"read" | "read_write">("read_write");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setScope("read_write");
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Veuillez renseigner un nom pour cette clé API.");
      return;
    }
    if (!userId) {
      setErrorMsg("Session expirée. Veuillez rafraîchir la page.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await cfCreateApiKey({
        userId,
        name: name.trim(),
        scope,
        userEmail,
      });

      if (res?.data) {
        const rawPlan = userPlan === "FREEMIUM" || userPlan === "STARTER" ? "FREE" : userPlan;
        const planLimits = getPlanLimits(rawPlan);
        const currentRateLimit = `${planLimits.rateLimitReqPerMin} req / min`;

        const generatedKeyData: ApiKeyItem = {
          id: res.data.id || `key_${Date.now()}`,
          name: name.trim(),
          prefix: res.data.prefix || res.data.key_prefix || "lsh_live_...",
          rawKey: res.data.raw_key || res.data.rawKey || res.data.api_key,
          scope,
          rateLimit: currentRateLimit,
          created_at: new Date().toISOString(),
        };

        try {
          confetti({ particleCount: 40, spread: 60 });
        } catch {}

        showToast.success("Clé API créée avec succès !");
        onCreated(generatedKeyData);
        onClose();
      } else {
        throw new Error("Réponse inattendue du serveur lors de la création.");
      }
    } catch (err: any) {
      const msg = err.message || "Erreur lors de la création de la clé API.";
      setErrorMsg(msg);
      showToast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const drawerDirection = isMobile ? "bottom" : "right";

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction={drawerDirection}>
      <DrawerContent
        direction={drawerDirection}
        widthClass="w-full sm:max-w-[620px] md:max-w-[680px]"
        className="h-auto max-h-[88vh] md:h-full md:max-h-full flex flex-col bg-white dark:bg-[#121215] border-zinc-200 dark:border-[#27272a] rounded-[10px] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-100 dark:border-[#202024] shrink-0 bg-white dark:bg-[#121215]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
              <KeyRound className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                Nouvelle Clé API
              </h3>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 mt-0.5">
                Générez un jeton sécurisé pour vos intégrations logicielles
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            disabled={isSubmitting}
            className="p-1.5 rounded-[8px] text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#1f1f23] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col gap-5 text-xs">
          {errorMsg && (
            <div className="px-4 py-3 rounded-[8px] bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {/* Name Field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="api-key-name-input" className="text-xs font-bold text-zinc-950 dark:text-white">
              Nom de l&apos;application / Service <span className="text-red-500">*</span>
            </label>
            <Input
              id="api-key-name-input"
              required
              placeholder="ex: Bot Telegram, Zapier, Backend Node.js..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className="h-10 rounded-[8px] bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a] text-xs font-medium text-zinc-950 dark:text-white"
            />
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Ce libellé vous permet d&apos;identifier facilement la source des requêtes dans vos journaux d&apos;activité.
            </span>
          </div>

          {/* Scope Selector (Accessible Radiogroup) */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-bold text-zinc-950 dark:text-white flex items-center justify-between">
              <span>Niveau de permission</span>
              <span className="text-xs text-brand font-bold">Sécurité renforcée</span>
            </label>

            <div role="radiogroup" aria-label="Niveau de permission" className="grid grid-cols-1 gap-3">
              {/* Option 1: Read & Write */}
              <button
                type="button"
                role="radio"
                aria-checked={scope === "read_write"}
                onClick={() => setScope("read_write")}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    setScope("read_write");
                  }
                }}
                className={`p-3.5 rounded-[8px] border text-left transition-all cursor-pointer flex items-start gap-3 select-none ${
                  scope === "read_write"
                    ? "bg-brand/10 border-brand/60 shadow-xs ring-1 ring-brand/30"
                    : "bg-zinc-50/80 dark:bg-[#18181b]/60 border-zinc-200 dark:border-[#27272a] hover:border-zinc-400 dark:hover:border-zinc-600"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    scope === "read_write"
                      ? "bg-brand border-brand text-white"
                      : "border-zinc-400 dark:border-zinc-600"
                  }`}
                >
                  {scope === "read_write" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-950 dark:text-white">
                      Read &amp; Write
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Recommandé
                    </span>
                  </div>
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    Permet de raccourcir des URLs, configurer le ciblage et lire les analyses de performance.
                  </p>
                </div>
              </button>

              {/* Option 2: Read Only */}
              <button
                type="button"
                role="radio"
                aria-checked={scope === "read"}
                onClick={() => setScope("read")}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    setScope("read");
                  }
                }}
                className={`p-3.5 rounded-[8px] border text-left transition-all cursor-pointer flex items-start gap-3 select-none ${
                  scope === "read"
                    ? "bg-brand/10 border-brand/60 shadow-xs ring-1 ring-brand/30"
                    : "bg-zinc-50/80 dark:bg-[#18181b]/60 border-zinc-200 dark:border-[#27272a] hover:border-zinc-400 dark:hover:border-zinc-600"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    scope === "read"
                      ? "bg-brand border-brand text-white"
                      : "border-zinc-400 dark:border-zinc-600"
                  }`}
                >
                  {scope === "read" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-xs font-bold text-zinc-950 dark:text-white">
                    Read Only
                  </span>
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    Lecture seule des métriques de clics et des informations de vos liens existants.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Security Banner */}
          <div className="p-4 rounded-[8px] bg-blue-500/10 border border-blue-500/25 flex items-start gap-3">
            <Shield className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
                Protection des opérations sensibles
              </span>
              <p className="text-xs font-medium text-blue-900 dark:text-blue-300 leading-relaxed">
                Toutes les actions destructives (suppression définitive de liens, de domaines ou de compte) requièrent impérativement une session sur l&apos;interface principale.
              </p>
            </div>
          </div>

          {/* Footer Submit Button */}
          <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-[#202024] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-bold border-zinc-300 dark:border-[#27272a] text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="glow"
              disabled={isSubmitting || !name.trim()}
              className="h-9 px-5 text-xs font-bold gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Génération en cours...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Générer la Clé API</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
