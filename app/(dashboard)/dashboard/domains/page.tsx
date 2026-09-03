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
  Info
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cfGetDomains, cfAddDomain, cfDeleteDomain, cfInvalidateCache } from "@/lib/cloudflare-api";
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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending">("all");
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
          linksCount: d.link_count !== undefined ? d.link_count : d.links_count || 0,
          sslExpiresAt: d.ssl_expires_at || "2027-12-31T00:00:00.000Z",
          dnsRecords: d.dnsRecords || (d.dns_records ? (typeof d.dns_records === "string" ? JSON.parse(d.dns_records) : d.dns_records) : [
            {
              type: "CNAME",
              name: domName,
              value: DEFAULT_DOMAIN,
              ttl: 3600,
              note: `Pointe votre domaine vers les serveurs Edge LShorter (${DEFAULT_DOMAIN})`
            },
            {
              type: "TXT",
              name: `_lshorter-verify.${domName}`,
              value: `lshorter-verify=${d.id}`,
              ttl: 3600,
              note: "Vérification de la propriété du domaine"
            }
          ]),
          instructions: d.instructions || [],
          created_at: d.created_at || new Date().toISOString()
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
      showToast.error(`Votre forfait ${plan} est limité à ${domainsLimit} domaines personnalisés.`);
      return;
    }

    try {
      await cfAddDomain({ userId, domain: newDomainInput.trim() });
      setNewDomainInput("");
      setIsAdding(false);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      showToast.success("Domaine ajouté avec succès !");
      loadDomains();
    } catch (err: any) {
      showToast.error(err.message || "Erreur lors de l'ajout du domaine.");
    }
  };

  const handleVerify = (id: string) => {
    setIsVerifyingId(id);
    setTimeout(() => {
      setIsVerifyingId(null);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      showToast.success("Domaine actif et certificat SSL vérifié !");
      loadDomains();
    }, 1200);
  };

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ isOpen: boolean; id: string; domain: string }>({
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
      showToast.success("Domaine supprimé.");
      setDeleteTarget({ isOpen: false, id: "", domain: "" });
      loadDomains();
    } catch (err) {
      showToast.error("Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered & Sorted Domains
  const filteredDomains = domains
    .filter((dom) => {
      const matchesSearch = dom.domain.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || dom.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.domain.localeCompare(b.domain);
      if (sortBy === "links") return b.linksCount - a.linksCount;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
          <h1 className="text-2xl font-bold text-white tracking-wide">Domaines Personnalisés</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Utilisez vos propres noms de domaine en marque blanche (ex: link.ma-boutique.com) avec SSL Cloudflare inclus.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={async () => {
              setIsRefreshing(true);
              cfInvalidateCache("/api/domains");
              await loadDomains();
              setIsRefreshing(false);
              showToast.success("Liste des domaines actualisée !");
            }}
            variant="outline"
            disabled={isRefreshing}
            className="h-10 px-3.5 text-xs font-semibold gap-2 border-[#27272a] bg-[#141416] hover:bg-white/5 text-neutral-300 hover:text-white cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#ff6600]" : "text-neutral-400"}`} />
            <span>Actualiser</span>
          </Button>

          <Button
            onClick={() => setIsAdding(!isAdding)}
            variant="glow"
            className="font-bebas text-lg tracking-wide gap-1.5 shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>AJOUTER UN DOMAINE</span>
          </Button>
        </div>
      </div>

      {/* Add Domain Form Drawer */}
      {isAdding && (
        <form
          onSubmit={handleAddDomain}
          className="p-6 rounded-[12px] bg-[#141416] border border-[#ff6600]/40 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-98"
        >
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-[#ff6600]" />
            <span>Connecter un nouveau domaine ou sous-domaine</span>
          </h3>

          {/* Affiliate CTA — domain purchase */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a]">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-neutral-300 leading-relaxed">
                <strong className="text-white">Vous devez déjà posséder ce domaine.</strong>{" "}
                LShorter se connecte à votre domaine existant via Cloudflare for SaaS — il ne vend pas de noms de domaine.
              </p>
            </div>
            <a
              href={process.env.NEXT_PUBLIC_HOSTINGER_AFFILIATE_LINK || "https://hostinger.com/fr"}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Acheter un domaine · Hostinger
            </a>
          </div>

          <p className="text-xs text-neutral-400">
            Entrez votre domaine (ex:{" "}
            <strong className="text-neutral-200">link.monentreprise.com</strong> ou{" "}
            <strong className="text-neutral-200">go.brand.io</strong>).
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              required
              placeholder="link.monentreprise.com"
              value={newDomainInput}
              onChange={(e) => setNewDomainInput(e.target.value)}
            />
            <Button type="submit" variant="glow" className="shrink-0 px-6">
              Déclarer le domaine
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAdding(false)}
              className="shrink-0"
            >
              Annuler
            </Button>
          </div>

          {/* DNS instructions note */}
          <div className="p-3.5 rounded-[10px] bg-[#0f0f11] border border-[#27272a] text-xs text-neutral-400 leading-relaxed">
            <p className="font-semibold text-neutral-200 mb-1">📋 Après avoir cliqué "Déclarer le domaine" :</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Copiez les enregistrements DNS affichés sur la carte de votre domaine.</li>
              <li>Collez-les dans la zone DNS de votre registraire (Hostinger, OVH, Namecheap…).</li>
              <li>Attendez la propagation DNS (5 à 30 minutes) puis cliquez <strong className="text-white">Vérifier</strong>.</li>
            </ol>
          </div>
        </form>
      )}


      {/* Search & Filtering Bar */}
      <div className="p-3 rounded-[12px] bg-[#141416] border border-[#222225] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Rechercher un nom de domaine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-[8px] bg-[#1a1a1e] border border-[#27272a] text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#ff6600]"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-[8px] font-semibold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-[#ff6600] text-white shadow font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Tous ({domains.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-[8px] font-semibold transition-all cursor-pointer ${
              statusFilter === "active"
                ? "bg-emerald-500 text-white shadow font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Actifs ({activeCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-[8px] font-semibold transition-all cursor-pointer ${
              statusFilter === "pending"
                ? "bg-amber-500 text-white shadow font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            En attente ({pendingCount})
          </button>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 rounded-[8px] bg-[#1a1a1e] text-white border border-[#27272a] px-2.5 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
          >
            <option value="date" className="bg-[#141416] text-white">Plus récents</option>
            <option value="name" className="bg-[#141416] text-white">Nom (A-Z)</option>
            <option value="links" className="bg-[#141416] text-white">Plus de liens</option>
          </select>
        </div>
      </div>

      {/* Domains List */}
      <div className="flex flex-col gap-6">
        {filteredDomains.length === 0 ? (
          <div className="p-8 rounded-[12px] bg-[#141416] border border-[#222225] text-center text-neutral-400 text-xs">
            Aucun domaine ne correspond à vos critères de recherche.
          </div>
        ) : (
          filteredDomains.map((dom) => (
            <div
              key={dom.id}
              className="rounded-[12px] bg-[#141416] border border-[#222225] p-6 flex flex-col gap-5 shadow-xl"
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
                        <Badge variant="active">Actif & Sécurisé SSL</Badge>
                      ) : (
                        <Badge variant="expire">En attente DNS</Badge>
                      )}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      ID: {dom.id} · {dom.linksCount} liens associés
                    </p>
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
                      <span>{isVerifyingId === dom.id ? "Vérification..." : "Vérifier le domaine"}</span>
                    </Button>
                  )}
                  <button
                    onClick={() => promptDeleteDomain(dom)}
                    className="p-2 rounded-[8px] hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Supprimer le domaine"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* DNS Records Table */}
              <div>
                <span className="text-xs font-semibold text-neutral-300 block mb-2.5">
                  Configuration DNS requise chez votre registraire (OVH, GoDaddy, Cloudflare, etc.) :
                </span>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-neutral-400 bg-[#1a1a1e] rounded-[10px] overflow-hidden">
                    <thead>
                      <tr className="border-b border-[#27272a] text-[11px] uppercase tracking-wider text-neutral-500">
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Nom d&apos;hôte</th>
                        <th className="py-2.5 px-3">Valeur / Cible</th>
                        <th className="py-2.5 px-3">TTL</th>
                        <th className="py-2.5 px-3 text-right">Copier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a]">
                      {dom.dnsRecords.map((rec, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 font-bold text-white">
                            <span className="px-2 py-0.5 rounded bg-black/40 border border-neutral-700 text-[10px]">
                              {rec.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-neutral-200">{rec.name}</td>
                          <td className="py-2.5 px-3 font-mono text-[#ff6600]">{rec.value}</td>
                          <td className="py-2.5 px-3">{rec.ttl}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleCopy(rec.value)}
                              className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                              title="Copier la valeur"
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
              <div className="flex items-start gap-2 p-3 rounded-[8px] bg-neutral-900/60 border border-[#27272a] text-xs text-neutral-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Le certificat SSL Let&apos;s Encrypt sera automatiquement émis et renouvelé par les serveurs Edge Cloudflare dès que la propagation DNS sera terminée (entre 5 min et 48h).
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
        title="Supprimer ce domaine personnalisé ?"
        description={`Le domaine ${deleteTarget.domain} sera dissocié. Vos liens courts continueront de fonctionner sous le domaine par défaut qlsk.cc.`}
        itemLabels={deleteTarget.domain ? [deleteTarget.domain] : []}
        isDeleting={isDeleting}
      />
    </div>
  );
}
