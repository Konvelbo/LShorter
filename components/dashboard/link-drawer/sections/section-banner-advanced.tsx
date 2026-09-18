"use client";

import React from "react";
import { ExternalLink, Tag, Power } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SectionBannerAdvancedProps {
  redirectType: "302" | "301" | "307";
  setRedirectType: (type: "302" | "301" | "307") => void;
  passParams: boolean;
  setPassParams: React.Dispatch<React.SetStateAction<boolean>>;
  isActive?: boolean;
  setIsActive?: React.Dispatch<React.SetStateAction<boolean>>;
  tagsInput?: string;
  setTagsInput?: (tags: string) => void;
}

export function SectionBannerAdvanced({
  redirectType,
  setRedirectType,
  passParams,
  setPassParams,
  isActive = true,
  setIsActive,
  tagsInput = "",
  setTagsInput,
}: SectionBannerAdvancedProps) {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      {/* 1. Link Status (Active / Paused) */}
      {setIsActive && (
        <div className="p-3.5 rounded-[10px] bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors",
                isActive ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-zinc-200 dark:bg-neutral-800 text-zinc-500 dark:text-neutral-500",
              )}
            >
              <Power className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                Statut de la redirection
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-neutral-400 block">
                {isActive
                  ? "La redirection est active et traite les clics en temps réel."
                  : "La redirection est en pause. Les visiteurs verront une page 404/Inactive."}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsActive((prev) => !prev)}
            className={cn(
              "w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0",
              isActive ? "bg-emerald-500" : "bg-zinc-200 dark:bg-neutral-800",
            )}
          >
            <span
              className={cn(
                "w-4 h-4 rounded-full bg-white shadow-xs absolute top-1 transition-transform",
                isActive ? "translate-x-1" : "-translate-x-5",
              )}
            />
          </button>
        </div>
      )}

      {/* 2. Tags / Classification */}
      {setTagsInput && (
        <div className="flex flex-col gap-2 p-3.5 rounded-[10px] bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] shadow-xs">
          <label className="text-xs font-bold text-zinc-700 dark:text-neutral-300 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-brand" />
            <span>Tags &amp; Classification</span>
          </label>
          <Input
            placeholder="promo2026, affiliation, twitter (séparés par des virgules)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="bg-white dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] focus:border-brand text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 text-xs h-9 rounded-[8px]"
          />
          <p className="text-[10.5px] text-zinc-500 dark:text-neutral-500">
            Organisez et filtrez facilement vos liens dans le tableau de bord.
          </p>
        </div>
      )}

      {/* 3. HTTP Redirection Code */}
      <div className="flex flex-col gap-2.5 p-3.5 rounded-[10px] bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] shadow-xs">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300">
          Code de redirection HTTP
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { code: "302", title: "302", desc: "Temp (Recommandé)" },
            { code: "301", title: "301", desc: "Perm (SEO)" },
            { code: "307", title: "307", desc: "Strict" },
          ].map((item) => {
            const isSelected = redirectType === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => setRedirectType(item.code as any)}
                className={cn(
                  "p-2.5 rounded-[8px] border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer text-center",
                  isSelected
                    ? "bg-brand text-white border-brand shadow-md shadow-[var(--brand-primary-light)]"
                    : "bg-white dark:bg-[#18181c] border-zinc-200 dark:border-[#27272a] text-zinc-700 dark:text-neutral-300 hover:border-zinc-300 dark:hover:border-neutral-600",
                )}
              >
                <span className="text-sm font-extrabold">{item.title}</span>
                <span className="text-[9.5px] opacity-80">{item.desc}</span>
              </button>
            );
          })}
        </div>

        <div className="p-2.5 rounded-[8px] bg-white dark:bg-[#101012] border border-zinc-200 dark:border-[#27272a] text-[10.5px] text-zinc-600 dark:text-neutral-400 leading-relaxed shadow-xs">
          {redirectType === "302" && (
            <>
              💡 <strong>302 Temporaire (Recommandé)</strong> : Permet de comptabiliser précisément chaque clic et visiteur sans mise en cache excessive par les navigateurs.
            </>
          )}
          {redirectType === "301" && (
            <>
              💡 <strong>301 Permanent (SEO)</strong> : Transfère l'autorité SEO vers l'URL cible. Les navigateurs mettent la redirection en cache local.
            </>
          )}
          {redirectType === "307" && (
            <>
              💡 <strong>307 Temporaire Strict</strong> : Préserve la méthode HTTP exacte (POST, PUT). Idéal pour les API et webhooks.
            </>
          )}
        </div>
      </div>

      {/* 4. Forward Query Params Toggle */}
      <div className="p-3.5 rounded-[10px] bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] flex items-center justify-between gap-3 shadow-xs">
        <div>
          <span className="text-xs font-bold text-zinc-900 dark:text-white block">
            Transférer les paramètres de requête (Query Params)
          </span>
          <span className="text-[11px] text-zinc-500 dark:text-neutral-400 block mt-0.5">
            Transmet automatiquement les paramètres entrants (e.g. <code className="text-brand font-mono">?ref=...</code>) à l&apos;URL de destination.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setPassParams((prev) => !prev)}
          className={cn(
            "w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0",
            passParams ? "bg-brand" : "bg-zinc-200 dark:bg-neutral-800",
          )}
        >
          <span
            className={cn(
              "w-4 h-4 rounded-full bg-white shadow-xs absolute top-1 transition-transform",
              passParams ? "translate-x-1" : "-translate-x-5",
            )}
          />
        </button>
      </div>

      {/* Documentation Helper Link */}
      <div className="p-2.5 rounded-[8px] bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] flex items-center justify-between shadow-xs">
        <span className="text-[11px] text-zinc-500 dark:text-neutral-400">
          Besoin d&apos;aide sur les redirections avancées ?
        </span>
        <a
          href="/docs#advanced-redirects"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-bold text-brand hover:underline flex items-center gap-1"
        >
          <span>Consulter la doc</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
export { SectionBannerAdvanced as SectionAdvanced };

