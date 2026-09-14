"use client";

import React, { useState, useEffect } from "react";
import {
  Globe2,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  ArrowUpDown,
  Info,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  cfGetDomains,
  cfAddDomain,
  cfDeleteDomain,
  cfInvalidateCache,
} from "@/lib/cloudflare-api";
import { CustomDomain } from "@/types";
import { Badge } from "@/components/ui/badge";
import { DomainsPageSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast-provider";
import { DeleteConfirmModal } from "@/components/dashboard/delete-confirm-modal";
import confetti from "canvas-confetti";

export default function DomainsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [isVerifyingId, setIsVerifyingId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "pending"
  >("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "links">("date");

  const userId = session?.user?.id;
  const plan = (session?.user as any)?.plan || "FREEMIUM";
  const domainsLimit = plan === "BUSINESS" ? -1 : plan === "PRO" ? 15 : 3;
  const DEFAULT_DOMAIN = process.env.NEXT_PUBLIC_DEFAULT_DOMAIN || "lsho.cc";

  const loadDomains = async (isBackground = false) => {
    if (!userId) return;
    if (!isBackground) setIsLoading(true);
    try {
      const res = await cfGetDomains(userId);
      const rawDomains: CustomDomain[] = (res?.data || []).map((d: any) => {
        const domName = d.domain_name || d.domain;
        return {
          id: d.id,
          domain: domName,
          status: (d.status as any) || "pending",
          linksCount:
            d.link_count !== undefined ? d.link_count : d.links_count || 0,
          sslExpiresAt: d.ssl_expires_at || "2027-12-31T00:00:00.000Z",
          dnsRecords:
            d.dnsRecords ||
            (d.dns_records
              ? typeof d.dns_records === "string"
                ? JSON.parse(d.dns_records)
                : d.dns_records
              : [
                  {
                    type: "CNAME",
                    name: domName,
                    value: DEFAULT_DOMAIN,
                    ttl: 3600,
                    note: `Points your domain to LShorter Edge servers (${DEFAULT_DOMAIN})`,
                  },
                  {
                    type: "TXT",
                    name: `_lshorter-verify.${domName}`,
                    value: `lshorter-verify=${d.id}`,
                    ttl: 3600,
                    note: "Domain ownership verification",
                  },
                ]),
          instructions: d.instructions || [],
          userEmail: d.user_email || d.userEmail || d.email,
          userName:
            d.user_name ||
            d.userName ||
            d.user_full_name ||
            d.userFullName ||
            d.fullName,
          userFullName:
            d.user_full_name ||
            d.userFullName ||
            d.user_name ||
            d.userName ||
            d.fullName,
          email: d.user_email || d.userEmail || d.email,
          fullName:
            d.user_full_name ||
            d.userFullName ||
            d.user_name ||
            d.userName ||
            d.fullName,
          created_at: d.created_at || new Date().toISOString(),
        };
      });
      setDomains(rawDomains);
    } catch (err) {
      console.error("Error loading domains:", err);
      if (!isBackground) setDomains([]);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && userId) {
      loadDomains();
    }
  }, [status, userId]);

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedValue(val);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainInput.trim() || !userId) return;

    if (domainsLimit !== -1 && domains.length >= domainsLimit) {
      showToast.error(
        `Your ${plan} plan is limited to ${domainsLimit} custom domains.`,
      );
      return;
    }

    try {
      await cfAddDomain({
        userId,
        domain: newDomainInput.trim(),
        userEmail: session?.user?.email || undefined,
        userName: session?.user?.name || undefined,
        userFullName: session?.user?.name || undefined,
      });
      setNewDomainInput("");
      setIsAdding(false);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      showToast.success("Domain added successfully!");
      loadDomains();
    } catch (err: any) {
      showToast.error(err.message || "Error adding domain.");
    }
  };

  const handleVerify = (id: string) => {
    setIsVerifyingId(id);
    setTimeout(() => {
      setIsVerifyingId(null);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      showToast.success("Domain active and SSL certificate verified!");
      loadDomains();
    }, 1200);
  };

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    isOpen: boolean;
    id: string;
    domain: string;
  }>({
    isOpen: false,
    id: "",
    domain: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const promptDeleteDomain = (dom: CustomDomain) => {
    setDeleteTarget({
      isOpen: true,
      id: dom.id,
      domain: dom.domain,
    });
  };

  const confirmDeleteDomain = async () => {
    if (!deleteTarget.id) return;
    setIsDeleting(true);
    try {
      await cfDeleteDomain(deleteTarget.id, userId);
      cfInvalidateCache("/api/domains");
      showToast.success("Domain deleted.");
      setDeleteTarget({ isOpen: false, id: "", domain: "" });
      loadDomains();
    } catch (err) {
      showToast.error("Error deleting domain.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered & Sorted Domains
  const filteredDomains = domains
    .filter((dom) => {
      const matchesSearch = dom.domain
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || dom.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.domain.localeCompare(b.domain);
      if (sortBy === "links") return b.linksCount - a.linksCount;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  const activeCount = domains.filter((d) => d.status === "active").length;
  const pendingCount = domains.filter((d) => d.status === "pending").length;

  if (status === "loading" || isLoading) {
    return <DomainsPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Custom Domains
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Use your own white-label domain names (e.g. link.my-brand.com) with
            Cloudflare SSL included.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={async () => {
              setIsRefreshing(true);
              cfInvalidateCache("/api/domains");
              await loadDomains();
              setIsRefreshing(false);
              showToast.success("Domains list refreshed!");
            }}
            variant="outline"
            disabled={isRefreshing}
            className="h-10 px-3.5 text-xs font-semibold gap-2 border-[#27272a] bg-[#141416] hover:bg-white/5 text-neutral-300 hover:text-white cursor-pointer shadow-sm"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#ff6600]" : "text-neutral-400"}`}
            />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={() => setIsAdding(!isAdding)}
            variant="glow"
            className="font-bebas text-lg tracking-wide gap-1.5 shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>ADD A DOMAIN</span>
          </Button>
        </div>
      </div>

      {/* Add Domain Form Drawer */}
      {isAdding && (
        <form
          onSubmit={handleAddDomain}
          className="p-6 rounded-[10px] bg-[#141416] border border-[#ff6600]/40 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-98"
        >
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-[#ff6600]" />
            <span>Connect a new domain or subdomain</span>
          </h3>

          {/* Affiliate CTA — domain purchase */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a]">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-neutral-300 leading-relaxed">
                <strong className="text-white">
                  You must already own this domain.
                </strong>{" "}
                LShorter connects to your existing domain via Cloudflare for
                SaaS — it does not sell domain names.
              </p>
            </div>
            <a
              href={process.env.NEXT_PUBLIC_HOSTINGER_AFFILIATE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buy a domain · Hostinger
            </a>
          </div>

          <p className="text-xs text-neutral-400">
            Enter your domain (e.g.{" "}
            <strong className="text-neutral-200">link.mycompany.com</strong> or{" "}
            <strong className="text-neutral-200">go.brand.io</strong>).
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              required
              placeholder="link.mycompany.com"
              value={newDomainInput}
              onChange={(e) => setNewDomainInput(e.target.value)}
            />
            <Button type="submit" variant="glow" className="shrink-0 px-6">
              Declare domain
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAdding(false)}
              className="shrink-0"
            >
              Cancel
            </Button>
          </div>

          {/* DNS instructions note */}
          <div className="p-3.5 rounded-[10px] bg-[#0f0f11] border border-[#27272a] text-xs text-neutral-400 leading-relaxed">
            <p className="font-semibold text-neutral-200 mb-1">
              📋 After clicking &quot;Declare domain&quot; :
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Copy the DNS records displayed on your domain card.</li>
              <li>
                Paste them into your registrar&apos;s DNS management zone
                (Hostinger, OVH, Namecheap, etc.).
              </li>
              <li>
                Wait for DNS propagation (5 to 30 minutes), then click{" "}
                <strong className="text-white">Verify Domain</strong>.
              </li>
            </ol>
          </div>
        </form>
      )}

      {/* Search & Filtering Bar */}
      <div className="p-3 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search for a domain name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#ff6600]"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-[10px] font-semibold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-[#ff6600] text-white shadow font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            All ({domains.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-[10px] font-semibold transition-all cursor-pointer ${
              statusFilter === "active"
                ? "bg-emerald-500 text-white shadow font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Active ({activeCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-[10px] font-semibold transition-all cursor-pointer ${
              statusFilter === "pending"
                ? "bg-amber-500 text-white shadow font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Pending ({pendingCount})
          </button>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 rounded-[10px] bg-[#1a1a1e] text-white border border-[#27272a] px-2.5 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
          >
            <option value="date" className="bg-[#141416] text-white">
              Most recent
            </option>
            <option value="name" className="bg-[#141416] text-white">
              Name (A-Z)
            </option>
            <option value="links" className="bg-[#141416] text-white">
              Most links
            </option>
          </select>
        </div>
      </div>

      {/* Domains List */}
      <div className="flex flex-col gap-6">
        {filteredDomains.length === 0 ? (
          <div className="p-8 rounded-[10px] bg-[#141416] border border-[#222225] text-center text-neutral-400 text-xs">
            No domains match your search criteria.
          </div>
        ) : (
          filteredDomains.map((dom) => (
            <div
              key={dom.id}
              className="rounded-[10px] bg-[#141416] border border-[#222225] p-6 flex flex-col gap-5 shadow-xl"
            >
              {/* Domain Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#222225]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex items-center justify-center text-[#ff6600]">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{dom.domain}</span>
                      {dom.status === "active" ? (
                        <Badge variant="active">Active & SSL Secured</Badge>
                      ) : (
                        <Badge variant="expire">Pending DNS</Badge>
                      )}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      ID: {dom.id} · {dom.linksCount} associated links
                    </p>
                    {/* Owner / User Details (Full Name & Email) - empty if no info */}
                    {(() => {
                      const name =
                        dom.userFullName || dom.userName || dom.fullName;
                      const email = dom.userEmail || dom.email;
                      if (!name && !email) return null;
                      return (
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 bg-[#1a1a1e] px-2 py-0.5 rounded-[6px] border border-[#27272a] mt-1 truncate">
                          <span className="text-neutral-500 text-[10px] font-semibold shrink-0">
                            Owner:
                          </span>
                          {name && (
                            <span className="text-neutral-200 font-medium truncate">
                              {name}
                            </span>
                          )}
                          {name && email && (
                            <span className="text-neutral-600">·</span>
                          )}
                          {email && (
                            <span className="text-neutral-400 font-mono text-[10px] truncate">
                              {email}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {dom.status === "pending" && (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={isVerifyingId === dom.id}
                      onClick={() => handleVerify(dom.id)}
                      className="gap-1.5 text-xs"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isVerifyingId === dom.id ? "animate-spin" : ""}`}
                      />
                      <span>
                        {isVerifyingId === dom.id
                          ? "Verifying..."
                          : "Verify Domain"}
                      </span>
                    </Button>
                  )}
                  <button
                    onClick={() => promptDeleteDomain(dom)}
                    className="p-2 rounded-[10px] hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete domain"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* DNS Records Table */}
              <div>
                <span className="text-xs font-semibold text-neutral-300 block mb-2.5">
                  Required DNS configuration at your registrar (OVH, GoDaddy,
                  Cloudflare, Namecheap, etc.):
                </span>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-neutral-400 bg-[#1a1a1e] rounded-[10px] overflow-hidden">
                    <thead>
                      <tr className="border-b border-[#27272a] text-[11px] uppercase tracking-wider text-neutral-500">
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Host Name</th>
                        <th className="py-2.5 px-3">Value / Target</th>
                        <th className="py-2.5 px-3">TTL</th>
                        <th className="py-2.5 px-3 text-right">Copy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a]">
                      {dom.dnsRecords.map((rec, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 font-bold text-white">
                            <span className="px-2 py-0.5 rounded-[10px] bg-black/40 border border-neutral-700 text-[10px]">
                              {rec.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-neutral-200">
                            {rec.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[#ff6600]">
                            {rec.value}
                          </td>
                          <td className="py-2.5 px-3">{rec.ttl}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleCopy(rec.value)}
                              className="p-1 rounded-[10px] hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                              title="Copy value"
                            >
                              {copiedValue === rec.value ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Note / Instruction */}
              <div className="flex items-start gap-2 p-3 rounded-[10px] bg-neutral-900/60 border border-[#27272a] text-xs text-neutral-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Let&apos;s Encrypt SSL certificates are automatically issued
                  and renewed by Cloudflare Edge servers once DNS propagation
                  completes (5 min to 48 hours).
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteTarget.isOpen}
        onClose={() => setDeleteTarget({ isOpen: false, id: "", domain: "" })}
        onConfirm={confirmDeleteDomain}
        title="Delete this custom domain?"
        description={`The domain ${deleteTarget.domain} will be disconnected. Your short links will continue working under the default domain lsho.cc.`}
        itemLabels={deleteTarget.domain ? [deleteTarget.domain] : []}
        isDeleting={isDeleting}
      />
    </div>
  );
}
