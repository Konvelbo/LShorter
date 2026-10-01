"use client";

import React, { useState } from "react";
import {
  Globe2,
  Plus,
  CheckCircle2,
  Clock,
  Copy,
  RefreshCw,
} from "lucide-react";
import { PREVIEW_DOMAINS } from "@/lib/preview-data";
import { showToast } from "@/components/ui/toast-provider";

export default function PreviewDomainsPage() {
  const [domains] = useState(PREVIEW_DOMAINS);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    showToast.success("DNS record copied to clipboard.");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold ds-text-primary tracking-tight flex items-center gap-2.5">
            <span>Custom Branded Domains</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#465FFF]/10 text-[#465FFF] dark:text-[#7592FF] border border-[#D1E0FF] dark:border-[#465FFF]/30 font-mono font-semibold">
              3/5 Configured
            </span>
          </h1>
          <p className="text-[13px] ds-text-muted mt-0.5">
            Connect your own custom domains with automated SSL generation and global edge routing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => showToast.info("Preview: Domain registration modal active in full version.")}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Connect New Domain</span>
        </button>
      </div>

      {/* Domains List */}
      <div className="space-y-4">
        {domains.map((dom) => (
          <div
            key={dom.id}
            className="p-5 rounded-2xl ds-card space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E7EC] dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#465FFF]/10 border border-[#D1E0FF] dark:border-[#465FFF]/30 text-[#465FFF] dark:text-[#7592FF] flex items-center justify-center">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold ds-text-primary font-mono">{dom.domain}</span>
                    {dom.status === "active" ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified & Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-semibold">
                        <Clock className="w-3 h-3" />
                        Pending DNS
                      </span>
                    )}
                  </div>
                  <div className="text-xs ds-text-muted mt-0.5">
                    {dom.linksCount} short links mapped • SSL Certificate Auto-renewed
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => showToast.success(`Re-checking DNS status for ${dom.domain}...`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg ds-card text-xs font-medium ds-text-secondary hover:ds-text-primary cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#465FFF]" />
                  <span>Verify DNS</span>
                </button>
              </div>
            </div>

            {/* DNS Records */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider ds-text-muted">
                Required DNS Target (CNAME)
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-black/40 border border-[#E4E7EC] dark:border-white/10 flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-4">
                  <span className="text-[#465FFF] dark:text-[#7592FF] font-bold">CNAME</span>
                  <span className="ds-text-muted">{dom.domain.split(".")[0]}</span>
                  <span className="ds-text-primary font-semibold">edge.lsho.cc</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy("edge.lsho.cc", dom.id)}
                  className="ds-text-muted hover:ds-text-primary transition-colors cursor-pointer"
                >
                  {copiedKey === dom.id ? (
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs">Copied!</span>
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
