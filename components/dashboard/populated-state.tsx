"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Copy,
  ExternalLink,
  Share2,
  BarChart2,
  Edit3,
  Check,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Info,
  QrCode,
  RefreshCw,
} from "lucide-react";
import gsap from "gsap";
import { ShortLink, GlobalAnalytics } from "@/types";
import { formatNumber, formatDateRelative } from "@/lib/utils";
import { cfInvalidateCache } from "@/lib/cloudflare-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast-provider";
import { StatsBarChart } from "./stats-bar-chart";
import { LinkCreateModal } from "./link-create-modal";
import { LinkEditModal } from "./link-edit-modal";
import { LinkShareModal } from "./link-share-modal";
import { LinkQRModal } from "./link-qr-modal";
import confetti from "canvas-confetti";

interface PopulatedStateProps {
  links: ShortLink[];
  analytics: GlobalAnalytics;
  onRefresh?: () => void;
}

export function PopulatedState({ links, analytics, onRefresh }: PopulatedStateProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEditLink, setSelectedEditLink] = useState<ShortLink | null>(null);
  const [selectedShareLink, setSelectedShareLink] = useState<ShortLink | null>(null);
  const [selectedQRLink, setSelectedQRLink] = useState<ShortLink | null>(null);

  // GSAP animation ref
  const statsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (statsContainerRef.current) {
      gsap.fromTo(
        statsContainerRef.current.children,
        { opacity: 0, y: 20, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
        }
      );
    }
  }, []);

  const handleCopy = (link: ShortLink) => {
    navigator.clipboard.writeText(link.shortUrl);
    setCopiedId(link.id);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const recentLinks = links.slice(0, 5);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Banner Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Vue d&apos;ensemble</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Performance globale de vos redirections, conversions et clics en direct.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onRefresh && (
            <Button
              onClick={async () => {
                setIsRefreshing(true);
                cfInvalidateCache();
                await onRefresh();
                setIsRefreshing(false);
                showToast.success("Données actualisées !");
              }}
              variant="outline"
              disabled={isRefreshing}
              className="h-10 px-3.5 text-xs font-semibold gap-2 border-[#27272a] bg-[#141416] hover:bg-white/5 text-neutral-300 hover:text-white cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#ff6600]" : "text-neutral-400"}`} />
              <span>Actualiser</span>
            </Button>
          )}

          <Button
            onClick={() => setIsCreateOpen(true)}
            variant="glow"
            className="font-bebas text-lg tracking-wide gap-1.5 shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>CRÉER UN LIEN</span>
          </Button>
        </div>
      </div>

      {/* 4 Metric Cards (GSAP Staggered) */}
      <div
        ref={statsContainerRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Card 1: Clics totaux */}
        <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 flex flex-col justify-between h-36 relative group hover:border-[#ff6600]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">Clics totaux</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
              <span>{analytics.totalClicks > 0 ? `+${analytics.totalClicks}` : "0"}</span>
            </span>
          </div>
          <div>
            <span className="font-bebas text-5xl font-bold text-[#ff6600] tracking-wide">
              {formatNumber(analytics.totalClicks)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <span>{analytics.uniqueClicks.toLocaleString()} uniques</span>
            <span className="text-neutral-400">Temps réel Edge</span>
          </div>
        </div>

        {/* Card 2: Liens actifs */}
        <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 flex flex-col justify-between h-36 relative group hover:border-[#ff6600]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">Liens créés</span>
            <span className="text-xs font-bold text-emerald-400">{links.length}</span>
          </div>
          <div>
            <span className="font-bebas text-5xl font-bold text-white tracking-wide">
              {links.length}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <span>{links.filter((l) => l.isActive).length} actifs</span>
            <span className="text-neutral-400">Routage actif</span>
          </div>
        </div>

        {/* Card 3: Revenus trackés */}
        <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 flex flex-col justify-between h-36 relative group hover:border-[#ff6600]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">Revenus trackés</span>
            <span className="text-xs font-bold text-emerald-400">{analytics.trackedRevenue.toFixed(2)} €</span>
          </div>
          <div>
            <span className="font-bebas text-5xl font-bold text-white tracking-wide">
              {analytics.trackedRevenue.toFixed(2)} €
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <span>EPC: {analytics.epc} €</span>
            <span className="text-neutral-400">Conversions</span>
          </div>
        </div>

        {/* Card 4: Taux conversion */}
        <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 flex flex-col justify-between h-36 relative group hover:border-[#ff6600]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">Taux conversion</span>
            <span className="text-xs font-bold text-neutral-400">{analytics.avgCtr}%</span>
          </div>
          <div>
            <span className="font-bebas text-5xl font-bold text-white tracking-wide">
              {analytics.avgCtr}%
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <span>Moyenne des clics</span>
            <span className="text-neutral-400">Optimum &gt; 2%</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Clics par jour (Bar chart) + Top Pays */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: Bar Chart */}
        <div className="lg:col-span-8">
          <StatsBarChart data={analytics.clicksByDay} />
        </div>

        {/* Right: Top Pays */}
        <div className="lg:col-span-4 rounded-[10px] bg-[#141416] border border-[#222225] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white tracking-wide">Top pays</h3>
              <Link
                href="/dashboard/analytics"
                className="text-xs text-[#ff6600] hover:underline flex items-center gap-1 font-medium"
              >
                <span>Détails</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {analytics.topCountries.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                Aucun clic géolocalisé pour le moment.
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                {analytics.topCountries.slice(0, 5).map((country) => (
                  <div key={country.code} className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#ff6600] w-6">
                          {country.code}
                        </span>
                        <span className="text-neutral-300 font-medium">{country.name}</span>
                      </div>
                      <span className="text-neutral-400 font-mono">
                        {formatNumber(country.count)} ({country.percentage}%)
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-[#27272a] overflow-hidden">
                      <div
                        className="h-full bg-[#ff6600] rounded-full transition-all duration-500"
                        style={{ width: `${country.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#222225] flex items-center justify-between text-[11px] text-neutral-500">
            <span>{analytics.topCountries.length} pays enregistrés</span>
            <span>Edge Cloudflare</span>
          </div>
        </div>
      </div>

      {/* Bottom: Liens récents Table */}
      <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Liens récents</h3>
            <p className="text-xs text-neutral-400">Vos dernières redirections créées</p>
          </div>

          <Link
            href="/dashboard/links"
            className="text-xs text-[#ff6600] hover:underline font-semibold flex items-center gap-1"
          >
            <span>Voir tous les liens</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentLinks.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-500">
            Aucun lien récent. Cliquez sur &quot;CRÉER UN LIEN&quot; pour commencer.
          </div>
        ) : (
          <>
            {/* 1. Mobile Cards List (< 768px) */}
            <div className="flex flex-col gap-2.5 md:hidden">
              {recentLinks.map((link) => (
                <div
                  key={link.id}
                  className="rounded-xl bg-[#18181c] border border-[#27272a] p-3 flex flex-col gap-2 transition-all hover:border-[#ff6600]/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                        <span className="font-mono font-bold text-white text-xs truncate">
                          /{link.slug}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-1 flex items-center gap-1" title={link.targetUrl}>
                        <span className="text-[#ff6600] font-bold shrink-0">↳</span>
                        <span className="truncate">{link.targetUrl}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold font-mono text-white block">
                        {formatNumber(link.clicksCount || 0)}
                      </span>
                      <span className="text-[9.5px] text-neutral-400">clics</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#222225] text-xs">
                    <button
                      onClick={() => handleCopy(link)}
                      className="px-2.5 py-1 rounded-lg bg-[#ff6600]/15 text-[#ff771a] border border-[#ff6600]/30 hover:bg-[#ff6600] hover:text-white text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedId === link.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedEditLink(link)}
                        className="p-1.5 rounded-lg bg-white/5 text-neutral-400 hover:text-white"
                        title="Modifier"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#ff6600]" />
                      </button>
                      <button
                        onClick={() => setSelectedQRLink(link)}
                        className="p-1.5 rounded-lg bg-white/5 text-neutral-400 hover:text-white"
                        title="QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5 text-[#ff6600]" />
                      </button>
                      <button
                        onClick={() => setSelectedShareLink(link)}
                        className="p-1.5 rounded-lg bg-white/5 text-neutral-400 hover:text-white"
                        title="Partager"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={link.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-white/5 text-neutral-400 hover:text-white"
                        title="Tester"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. Desktop Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-400">
                <thead>
                  <tr className="border-b border-[#222225] text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                    <th className="pb-3 pl-2">Lien & Destination</th>
                    <th className="pb-3">URL Courte</th>
                    <th className="pb-3 text-right pr-4">Clics</th>
                    <th className="pb-3">Statut</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e22]">
                  {recentLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3.5 pl-2 max-w-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-white truncate group-hover:text-[#ff6600] transition-colors">
                            /{link.slug}
                          </span>
                          <span className="text-[11px] text-neutral-500 truncate" title={link.targetUrl}>
                            {link.targetUrl}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 font-mono text-xs text-neutral-300">
                        <div className="flex items-center gap-1.5">
                          <span>{link.shortUrl}</span>
                          <button
                            onClick={() => handleCopy(link)}
                            className="text-neutral-500 hover:text-white p-1 rounded transition-colors cursor-pointer"
                            title="Copier le lien"
                          >
                            {copiedId === link.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 text-right pr-4 font-mono font-bold text-white">
                        {formatNumber(link.clicksCount || 0)}
                      </td>

                      <td className="py-3.5">
                        <Badge variant={link.isActive ? "active" : "inactive"}>
                          {link.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </td>

                      <td className="py-3.5 text-right pr-2">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedEditLink(link)}
                            className="p-1.5 rounded-[6px] text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Modifier le lien"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#ff6600]" />
                          </button>
                          <button
                            onClick={() => setSelectedQRLink(link)}
                            className="p-1.5 rounded-[6px] text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Générer QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5 text-[#ff6600]" />
                          </button>
                          <button
                            onClick={() => setSelectedShareLink(link)}
                            className="p-1.5 rounded-[6px] text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Partager"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={link.shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-[6px] text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Tester la redirection"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {selectedEditLink && (
        <LinkEditModal
          isOpen={Boolean(selectedEditLink)}
          onClose={() => setSelectedEditLink(null)}
          link={selectedEditLink}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Share Modal */}
      {selectedShareLink && (
        <LinkShareModal
          isOpen={Boolean(selectedShareLink)}
          onClose={() => setSelectedShareLink(null)}
          link={selectedShareLink}
        />
      )}

      {/* QR Modal */}
      {selectedQRLink && (
        <LinkQRModal
          isOpen={Boolean(selectedQRLink)}
          onClose={() => setSelectedQRLink(null)}
          link={selectedQRLink}
        />
      )}

      {/* Create Link Modal */}
      <LinkCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
