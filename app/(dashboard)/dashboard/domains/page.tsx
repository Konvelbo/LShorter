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
  const [domainError, setDomainError] = useState<string | null>(null);
  const [isSubmittingDomain, setIsSubmittingDomain] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [isVerifyingId, setIsVerifyingId] = useState<string | null>(null);

  // Real-time detection of non-normalized characters & syntax validation
  const domainValidation = React.useMemo(() => {
    const raw = newDomainInput;
    if (!raw) {
      return {
        isValid: false,
        hasNonNormalized: false,
        issues: [] as string[],
        normalizedSuggestion: "",
      };
    }

    const issues: string[] = [];
    let hasNonNormalized = false;

    if (/[A-Z]/.test(raw)) {
      hasNonNormalized = true;
      issues.push("Caractères majuscules détectés (les noms de domaine DNS doivent être en minuscules).");
    }
    if (/\s/.test(raw)) {
      hasNonNormalized = true;
      issues.push("Espaces détectés dans le champ de saisie.");
    }
    if (/^https?:\/\//i.test(raw) || raw.includes("/") || raw.includes("?") || raw.includes("#") || raw.includes(":")) {
      hasNonNormalized = true;
      issues.push("Protocole (http/https), barre oblique (/) ou port détecté — saisissez uniquement l'hôte (ex: link.marque.com).");
    }
    if (/[^\x00-\x7F]/.test(raw)) {
      hasNonNormalized = true;
      issues.push("Caractères accentués ou Unicode non normalisés détectés (utilisez l'alphabet ASCII standard a-z, 0-9, -).");
    }
    const invalidChars = raw.replace(/^https?:\/\//i, "").match(/[^a-zA-Z0-9.-]/g);
    if (invalidChars && invalidChars.length > 0) {
      hasNonNormalized = true;
      const uniqueInvalid = Array.from(new Set(invalidChars)).join(" ");
      issues.push(`Caractères spéciaux interdits détectés : ${uniqueInvalid}`);
    }

    const cleaned = raw
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      .split("?")[0]
      .split(":")[0]
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9.-]/g, "");

    const labels = cleaned.split(".");
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;
    const isSyntaxValid =
      !hasNonNormalized &&
      domainRegex.test(cleaned) &&
      labels.length >= 2 &&
      !cleaned.includes("..") &&
      !labels.some((l) => l.startsWith("-") || l.endsWith("-"));

    if (!hasNonNormalized && cleaned.length > 0 && !isSyntaxValid) {
      issues.push("Format de domaine incomplet ou extension TLD invalide (ex: link.mycompany.com).");
    }

    return {
      isValid: isSyntaxValid,
      hasNonNormalized,
      issues,
      normalizedSuggestion: cleaned,
    };
  }, [newDomainInput]);

  // Verify via Cloudflare DNS-over-HTTPS that the root/registrable domain actually exists on the internet
  const verifyDomainExistsOnDns = async (hostname: string): Promise<{ exists: boolean; reason?: string }> => {
    const parts = hostname.toLowerCase().split(".");
    const tld = parts[parts.length - 1];
    const reservedTlds = ["test", "invalid", "localhost", "local", "example", "internal", "lan"];
    if (reservedTlds.includes(tld)) {
      return { exists: false, reason: `L'extension .${tld} est réservée et n'existe pas sur le réseau DNS public.` };
    }

    // Check registrable root domain (last 2 labels, or last 3 for co.uk / com.fr etc.)
    const rootDomain = parts.length > 2 ? parts.slice(-2).join(".") : hostname;
    try {
      const [nsRes, aRes] = await Promise.all([
        fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(rootDomain)}&type=NS`, {
          headers: { Accept: "application/dns-json" },
        }),
        fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`, {
          headers: { Accept: "application/dns-json" },
        }),
      ]);

      if (!nsRes.ok) return { exists: true };
      const nsData = await nsRes.json();
      const aData = aRes.ok ? await aRes.json() : null;

      // RCODE 3 = NXDOMAIN (Non-Existent Domain)
      if (nsData.Status === 3) {
        return {
          exists: false,
          reason: `Le domaine "${rootDomain}" n'existe pas (NXDOMAIN). Aucun serveur DNS n'est associé à ce nom de domaine.`,
        };
      }

      const hasNsOrAuthority =
        (Array.isArray(nsData.Answer) && nsData.Answer.length > 0) ||
        (Array.isArray(nsData.Authority) && nsData.Authority.length > 0) ||
        (aData && Array.isArray(aData.Answer) && aData.Answer.length > 0);

      if (!hasNsOrAuthority) {
        return {
          exists: false,
          reason: `Impossible de trouver d'enregistrement DNS actif pour "${rootDomain}". Vérifiez que vous avez bien enregistré ce domaine.`,
        };
      }

      return { exists: true };
    } catch {
      // If offline/CORS blocked, fall back to strict syntax check
      return { exists: true };
    }
  };

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
    setDomainError(null);
    if (!newDomainInput.trim() || !userId) return;

    if (domainValidation.hasNonNormalized || !domainValidation.isValid) {
      const msg =
        domainValidation.issues[0] ||
        "Nom de domaine invalide ou contenant des caractères non normalisés.";
      setDomainError(msg);
      showToast.error(msg);
      return;
    }

    if (domainsLimit !== -1 && domains.length >= domainsLimit) {
      showToast.error(
        `Your ${plan} plan is limited to ${domainsLimit} custom domains.`,
      );
      return;
    }

    const cleanHost = domainValidation.normalizedSuggestion;
    setIsSubmittingDomain(true);

    try {
      const dnsCheck = await verifyDomainExistsOnDns(cleanHost);
      if (!dnsCheck.exists) {
        const errReason =
          dnsCheck.reason ||
          `Le domaine "${cleanHost}" n'existe pas sur le réseau DNS public.`;
        setDomainError(errReason);
        showToast.error(errReason);
        setIsSubmittingDomain(false);
        return;
      }

      await cfAddDomain({
        userId,
        domain: cleanHost,
        userEmail: session?.user?.email || undefined,
        userName: session?.user?.name || undefined,
        userFullName: session?.user?.name || undefined,
      });
      setNewDomainInput("");
      setDomainError(null);
      setIsAdding(false);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      showToast.success(`Domain "${cleanHost}" declared! Configure your DNS records below.`);
      loadDomains();
    } catch (err: any) {
      setDomainError(err.message || "Error adding domain.");
      showToast.error(err.message || "Error adding domain.");
    } finally {
      setIsSubmittingDomain(false);
    }
  };

  const handleVerify = async (dom: CustomDomain) => {
    setIsVerifyingId(dom.id);
    try {
      const cnameRes = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(dom.domain)}&type=CNAME`,
        { headers: { Accept: "application/dns-json" } }
      );
      const cnameJson = cnameRes.ok ? await cnameRes.json() : null;
      const answers = Array.isArray(cnameJson?.Answer) ? cnameJson.Answer : [];
      const pointsToEdge = answers.some((a: any) =>
        String(a.data || "").toLowerCase().includes(DEFAULT_DOMAIN.toLowerCase())
      );

      if (!pointsToEdge) {
        showToast.error(
          `L'enregistrement CNAME de ${dom.domain} vers ${DEFAULT_DOMAIN} n'est pas encore détecté sur les serveurs DNS. Vérifiez votre zone DNS.`
        );
      } else {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        showToast.success("Domain active and SSL certificate verified!");
        loadDomains();
      }
    } catch {
      showToast.error("Unable to verify DNS propagation right now.");
    } finally {
      setIsVerifyingId(null);
    }
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
    <div className="flex flex-col gap-6 animate-in fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Custom Domains
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
            className="h-10 px-3.5 text-xs font-semibold gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#465FFF]" : "text-slate-500 dark:text-slate-400"}`}
            />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={() => {
              setIsAdding(!isAdding);
              setDomainError(null);
            }}
            variant="glow"
            className="font-semibold text-sm tracking-wide gap-1.5 shrink-0 bg-[#465FFF] hover:bg-[#3b51e6] text-white shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>ADD A DOMAIN</span>
          </Button>
        </div>
      </div>

      {/* Add Domain Form Drawer */}
      {isAdding && (
        <form
          onSubmit={handleAddDomain}
          className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-lg flex flex-col gap-5 animate-in fade-in zoom-in-98"
        >
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#465FFF]/10 flex items-center justify-center text-[#465FFF]">
              <Globe2 className="w-4 h-4" />
            </div>
            <span>Connect a new domain or subdomain</span>
          </h3>

          {/* Affiliate CTA — domain purchase */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-800/50">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong className="font-bold text-slate-900 dark:text-white">
                  You must already own this domain.
                </strong>{" "}
                LShorter connects to your existing domain via Cloudflare for
                SaaS — it does not sell domain names.
              </p>
            </div>
            <a
              href={process.env.NEXT_PUBLIC_HOSTINGER_AFFILIATE_LINK || "https://www.hostinger.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buy a domain · Hostinger
            </a>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Enter your domain (e.g.{" "}
            <strong className="font-semibold text-slate-900 dark:text-slate-100">
              link.mycompany.com
            </strong>{" "}
            or{" "}
            <strong className="font-semibold text-slate-900 dark:text-slate-100">
              go.brand.io
            </strong>
            ).
          </p>

          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Input
                  required
                  data-testid="custom-domain-input"
                  placeholder="link.mycompany.com"
                  value={newDomainInput}
                  onChange={(e) => {
                    setNewDomainInput(e.target.value);
                    if (domainError) setDomainError(null);
                  }}
                  className={
                    domainValidation.hasNonNormalized || domainError
                      ? "border-rose-500 dark:border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/15"
                      : ""
                  }
                />
              </div>
              <Button
                type="submit"
                variant="glow"
                disabled={isSubmittingDomain || domainValidation.hasNonNormalized}
                className="shrink-0 px-6 bg-[#465FFF] hover:bg-[#3b51e6] text-white font-semibold disabled:opacity-50"
              >
                {isSubmittingDomain ? "Checking DNS..." : "Declare domain"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setDomainError(null);
                }}
                className="shrink-0 border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
              >
                Cancel
              </Button>
            </div>

            {/* Real-Time Non-Normalized Character & DNS Validation Alert */}
            {(domainValidation.issues.length > 0 || domainError) && (
              <div
                data-testid="domain-validation-alert"
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    {domainError ? (
                      <p className="font-semibold">{domainError}</p>
                    ) : (
                      domainValidation.issues.map((issue, idx) => (
                        <p key={idx} className="font-medium">
                          {issue}
                        </p>
                      ))
                    )}
                  </div>
                </div>
                {domainValidation.hasNonNormalized &&
                  domainValidation.normalizedSuggestion && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewDomainInput(domainValidation.normalizedSuggestion);
                        setDomainError(null);
                      }}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      Normaliser en « {domainValidation.normalizedSuggestion} »
                    </button>
                  )}
              </div>
            )}
          </div>

          {/* DNS instructions note — fully adapted to Light and Dark Mode */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <p className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
              <span>📋 After clicking &quot;Declare domain&quot; :</span>
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
              <li>Copy the DNS records displayed on your domain card.</li>
              <li>
                Paste them into your registrar&apos;s DNS management zone
                (Hostinger, OVH, Namecheap, etc.).
              </li>
              <li>
                Wait for DNS propagation (5 to 30 minutes), then click{" "}
                <strong className="font-bold text-slate-900 dark:text-white">
                  Verify Domain
                </strong>
                .
              </li>
            </ol>
          </div>
        </form>
      )}

      {/* Search & Filtering Bar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search for a domain name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#465FFF]"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-[#465FFF] text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            All ({domains.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              statusFilter === "active"
                ? "bg-emerald-500 text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Active ({activeCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              statusFilter === "pending"
                ? "bg-amber-500 text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Pending ({pendingCount})
          </button>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 px-2.5 text-xs focus:outline-none focus:border-[#465FFF] cursor-pointer"
          >
            <option value="date">Most recent</option>
            <option value="name">Name (A-Z)</option>
            <option value="links">Most links</option>
          </select>
        </div>
      </div>

      {/* Domains List */}
      <div className="flex flex-col gap-6">
        {filteredDomains.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-xs shadow-xs">
            No domains match your search criteria.
          </div>
        ) : (
          filteredDomains.map((dom) => (
            <div
              key={dom.id}
              className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col gap-5 shadow-sm"
            >
              {/* Domain Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#465FFF]/10 border border-[#465FFF]/20 flex items-center justify-center text-[#465FFF]">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{dom.domain}</span>
                      {dom.status === "active" ? (
                        <Badge variant="active">Active & SSL Secured</Badge>
                      ) : (
                        <Badge variant="expire">Pending DNS</Badge>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ID: {dom.id} · {dom.linksCount} associated links
                    </p>
                    {(() => {
                      const name =
                        dom.userFullName || dom.userName || dom.fullName;
                      const email = dom.userEmail || dom.email;
                      if (!name && !email) return null;
                      return (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 mt-1 truncate">
                          <span className="text-slate-500 text-[10px] font-semibold shrink-0">
                            Owner:
                          </span>
                          {name && (
                            <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                              {name}
                            </span>
                          )}
                          {name && email && (
                            <span className="text-slate-400">·</span>
                          )}
                          {email && (
                            <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px] truncate">
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
                      onClick={() => handleVerify(dom)}
                      className="gap-1.5 text-xs bg-[#465FFF] hover:bg-[#3b51e6] text-white"
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
                    className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Delete domain"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* DNS Records Table */}
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2.5">
                  Required DNS configuration at your registrar (OVH, GoDaddy,
                  Cloudflare, Namecheap, etc.):
                </span>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-900/70">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Host Name</th>
                        <th className="py-2.5 px-3">Value / Target</th>
                        <th className="py-2.5 px-3">TTL</th>
                        <th className="py-2.5 px-3 text-right">Copy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                      {dom.dnsRecords.map((rec, i) => (
                        <tr key={i} className="hover:bg-slate-100/60 dark:hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                            <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px]">
                              {rec.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200">
                            {rec.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[#465FFF] font-semibold">
                            {rec.value}
                          </td>
                          <td className="py-2.5 px-3">{rec.ttl}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleCopy(rec.value)}
                              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                              title="Copy value"
                            >
                              {copiedValue === rec.value ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
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
              <div className="flex items-start gap-2 p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 text-xs text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
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
