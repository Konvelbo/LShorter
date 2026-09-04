"use client";

import React, { useState } from "react";
import {
  Link2,
  Settings,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
  Globe2,
  Lock,
  QrCode,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkCreateModal } from "./link-create-modal";
import { GlobalAnalytics } from "@/types";
import { formatNumber } from "@/lib/utils";

interface EmptyStateProps {
  onLinkCreated?: () => void;
  analytics?: GlobalAnalytics;
}

export function EmptyState({ onLinkCreated, analytics }: EmptyStateProps) {
  const [urlInput, setUrlInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalClicks = analytics?.totalClicks ?? 0;
  const uniqueClicks = analytics?.uniqueClicks ?? 0;
  const trackedRevenue = analytics?.trackedRevenue ?? 0;
  const avgCtr = analytics?.avgCtr ?? 0;

  const handleShortenClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 4 Stats Cards — Real Data Only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-xs font-semibold text-neutral-400">Clics totaux</span>
          <div className="my-2">
            <span className="font-bebas text-4xl font-bold tracking-wide text-[#ff6600]">
              {formatNumber(totalClicks)}
            </span>
          </div>
          <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1">
            {totalClicks > 0 ? `+${totalClicks} clics` : "Temps réel Edge"}
          </span>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-xs font-semibold text-neutral-400">Clics uniques</span>
          <div className="my-2">
            <span className="font-bebas text-4xl font-bold tracking-wide text-white">
              {formatNumber(uniqueClicks)}
            </span>
          </div>
          <span className="text-xs font-semibold text-neutral-500">
            {uniqueClicks > 0 ? `${uniqueClicks} visiteurs` : "0 visiteur"}
          </span>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-xs font-semibold text-neutral-400">Revenus attribués</span>
          <div className="my-2">
            <span className="font-bebas text-4xl font-bold tracking-wide text-white">
              {trackedRevenue.toFixed(2)} €
            </span>
          </div>
          <span className="text-xs font-semibold text-neutral-500">
            Conversions trackées
          </span>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-xs font-semibold text-neutral-400">CTR moyen</span>
          <div className="my-2">
            <span className="font-bebas text-4xl font-bold tracking-wide text-white">
              {avgCtr}%
            </span>
          </div>
          <span className="text-xs font-semibold text-neutral-500">
            Moyenne des clics
          </span>
        </div>
      </div>

      {/* Big Center Shorten Box matching Screenshot 1 */}
      <div className="p-8 md:p-12 rounded-[10px] bg-[#141416] border-2 border-dashed border-[#ff6600]/40 flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute w-72 h-72 bg-[#ff6600]/5 rounded-full blur-3xl pointer-events-none -top-10" />

        {/* Center Icon */}
        <div className="w-16 h-16 rounded-full bg-[#27272a] border border-[#3f3f46] flex items-center justify-center mb-5 shadow-xl relative">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-[#ff6600]" />
            <div className="w-5 h-3 rounded-full bg-white" />
          </div>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
          Créez votre premier lien court
        </h2>
        <p className="text-xs md:text-sm text-neutral-400 max-w-lg mb-8">
          Collez une URL longue dans le champ ci-dessous et cliquez sur{" "}
          <span className="text-[#ff6600] font-semibold">RACCOURCIR</span> pour générer votre premier lien trackable.
        </p>

        {/* Shorten Input Form */}
        <form
          onSubmit={handleShortenClick}
          className="w-full max-w-xl flex flex-col sm:flex-row items-center gap-2 mb-10"
        >
          <input
            type="url"
            required
            placeholder="https://votre-site.com/page-de-destination..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full h-12 rounded-[10px] bg-white text-neutral-900 px-4 text-sm placeholder:text-neutral-500 font-medium focus:outline-none focus:ring-2 focus:ring-[#ff6600]"
          />
          <Button
            type="submit"
            variant="glow"
            className="w-full sm:w-auto h-12 px-8 font-bebas text-xl tracking-wider shrink-0"
          >
            RACCOURCIR
          </Button>
        </form>

        {/* 3 Steps Timeline */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-xs text-neutral-400">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a]">
            <span className="w-5 h-5 rounded-full bg-[#ff6600] text-white font-bold text-[11px] flex items-center justify-center">
              1
            </span>
            <span className="font-medium text-neutral-200">Copiez votre URL</span>
          </div>

          <span className="text-neutral-600">→</span>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a]">
            <span className="w-5 h-5 rounded-full bg-[#ff6600] text-white font-bold text-[11px] flex items-center justify-center">
              2
            </span>
            <span className="font-medium text-neutral-200">Collez & raccourcissez</span>
          </div>

          <span className="text-neutral-600">→</span>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a]">
            <span className="w-5 h-5 rounded-full bg-[#ff6600] text-white font-bold text-[11px] flex items-center justify-center">
              3
            </span>
            <span className="font-medium text-neutral-200">Partagez & analysez</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: NOS FONCTIONNALITÉS (Matching Screenshot 1) */}
      <div className="flex flex-col gap-3 pt-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[#ff6600]">
          Nos fonctionnalités
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Feature Card 1 */}
          <div className="p-6 rounded-[10px] bg-[#141416] border border-[#222225] border-l-4 border-l-[#ff6600] flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-white text-sm mb-1">
              <Link2 className="w-4 h-4 text-neutral-400" />
              <span>Liens & Ciblage</span>
            </div>
            <ul className="flex flex-col gap-2 text-xs text-neutral-300">
              <li className="flex items-center gap-2">
                <span className="text-[#ff6600] font-bold">✓</span> Branded Links
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff6600] font-bold">✓</span> Redirects
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff6600] font-bold">✓</span> Country targeting
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff6600] font-bold">✓</span> Link cloaking
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff6600] font-bold">✓</span> Deep links
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff6600] font-bold">✓</span> Tags for Links
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff6600] font-bold">✓</span> Mobile targeting
              </li>
            </ul>
          </div>

          {/* Feature Card 2 */}
          <div className="p-6 rounded-[10px] bg-[#141416] border border-[#222225] border-l-4 border-l-[#ff6600] flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-white text-sm mb-1">
              <Settings className="w-4 h-4 text-neutral-400" />
              <span>Gestion & Contrôle</span>
            </div>
            <ul className="flex flex-col gap-2 text-xs text-neutral-300">
              <li className="flex items-center gap-2">
                <span className="text-[#ff6600] font-bold">✓</span> Custom Domains
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff6600] font-bold">✓</span> Region Targeting
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff6600] font-bold">✓</span> Referrer Hiding
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff6600] font-bold">✓</span> Link permissions
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff6600] font-bold">✓</span> Main page redirect
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff6600] font-bold">✓</span> API
              </li>
            </ul>
          </div>

          {/* Feature Card 3 */}
          <div className="p-6 rounded-[10px] bg-[#141416] border border-[#222225] border-l-4 border-l-[#ff6600] flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-white text-sm mb-1">
              <BarChart3 className="w-4 h-4 text-neutral-400" />
              <span>Analytics & Sécurité</span>
            </div>
            <ul className="flex flex-col gap-2 text-xs text-neutral-300">
              <li className="flex items-center gap-2">
                <span className="text-[#ff6600] font-bold">✓</span> Tracked clicks
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff6600] font-bold">✓</span> Link expiration
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff6600] font-bold">✓</span> Password Protection
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff6600] font-bold">✓</span> UTM builder
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff6600] font-bold">✓</span> Destination URL changing
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff6600] font-bold">✓</span> QR Code automatique
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Link Create Modal */}
      <LinkCreateModal
        isOpen={isModalOpen}
        initialUrl={urlInput}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          if (onLinkCreated) onLinkCreated();
        }}
      />
    </div>
  );
}
