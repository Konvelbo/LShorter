"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Globe2,
  X,
  Loader2,
  Info,
  ExternalLink,
  Check,
  AlertCircle,
  Server,
} from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast-provider";
import { cfAddDomain } from "@/lib/cloudflare-api";
import confetti from "canvas-confetti";

interface DomainDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  userId?: string;
  userEmail?: string;
  userName?: string;
  plan?: string;
  domainsCount?: number;
  domainsLimit?: number;
  onUpgrade?: () => void;
}

export function DomainDrawer({
  isOpen,
  onClose,
  onCreated,
  userId,
  userEmail,
  userName,
  plan = "FREE",
  domainsCount = 0,
  domainsLimit = 3,
  onUpgrade,
}: DomainDrawerProps) {
  const [domainInput, setDomainInput] = useState("");
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
      setDomainInput("");
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Client-side domain normalization & validation
  const validation = useMemo(() => {
    const raw = domainInput.trim();
    if (!raw) {
      return {
        isValid: false,
        hasNonNormalized: false,
        issues: [],
        normalizedSuggestion: "",
      };
    }

    const issues: string[] = [];
    let hasNonNormalized = false;

    if (
      raw.startsWith("http://") ||
      raw.startsWith("https://") ||
      raw.includes("/") ||
      raw.includes("?") ||
      raw.includes("#") ||
      raw.includes(":")
    ) {
      hasNonNormalized = true;
      issues.push(
        "Protocole (http/https), slash (/) ou port détecté — saisissez uniquement l'hôte (ex: link.marque.com).",
      );
    }
    if (/[^\x00-\x7F]/.test(raw)) {
      hasNonNormalized = true;
      issues.push(
        "Caractères accentués ou Unicode non normalisés détectés (utilisez l'alphabet ASCII a-z, 0-9, -).",
      );
    }
    const invalidChars = raw
      .replace(/^https?:\/\//i, "")
      .match(/[^a-zA-Z0-9.-]/g);
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
    const domainRegex =
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;
    const isSyntaxValid =
      !hasNonNormalized &&
      domainRegex.test(cleaned) &&
      labels.length >= 2 &&
      !cleaned.includes("..") &&
      !labels.some((l) => l.startsWith("-") || l.endsWith("-"));

    if (!hasNonNormalized && cleaned.length > 0 && !isSyntaxValid) {
      issues.push(
        "Format de domaine incomplet ou extension TLD invalide (ex: link.mycompany.com).",
      );
    }

    return {
      isValid: isSyntaxValid,
      hasNonNormalized,
      issues,
      normalizedSuggestion: cleaned,
    };
  }, [domainInput]);

  // DNS validation via Cloudflare DNS over HTTPS
  const verifyDomainExistsOnDns = async (
    hostname: string,
  ): Promise<{ exists: boolean; reason?: string }> => {
    const parts = hostname.toLowerCase().split(".");
    const tld = parts[parts.length - 1];
    const reservedTlds = [
      "test",
      "invalid",
      "localhost",
      "local",
      "example",
      "internal",
      "lan",
    ];
    if (reservedTlds.includes(tld)) {
      return {
        exists: false,
        reason: `L'extension .${tld} est réservée et n'existe pas sur le réseau DNS public.`,
      };
    }

    const rootDomain = parts.length > 2 ? parts.slice(-2).join(".") : hostname;
    try {
      const [nsRes, aRes] = await Promise.all([
        fetch(
          `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(rootDomain)}&type=NS`,
          { headers: { Accept: "application/dns-json" } },
        ),
        fetch(
          `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`,
          { headers: { Accept: "application/dns-json" } },
        ),
      ]);

      if (!nsRes.ok) return { exists: true };
      const [nsData, aData] = await Promise.all([
        nsRes.json().catch(() => null),
        aRes.ok ? aRes.json().catch(() => null) : Promise.resolve(null),
      ]);

      const rootExists =
        nsData?.Status === 0 &&
        Array.isArray(nsData?.Answer) &&
        nsData.Answer.length > 0;
      const hostExists =
        aData?.Status === 0 &&
        Array.isArray(aData?.Answer) &&
        aData.Answer.length > 0;

      if (!rootExists && !hostExists) {
        return {
          exists: false,
          reason: `Le domaine "${rootDomain}" n'est pas encore enregistré ou ne possède aucun serveur de noms (NS) public.`,
        };
      }
      return { exists: true };
    } catch {
      return { exists: true };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!domainInput.trim()) {
      setErrorMsg("Veuillez renseigner un nom de domaine.");
      return;
    }

    if (!userId) {
      setErrorMsg("Session expirée. Veuillez vous reconnecter.");
      return;
    }

    if (validation.hasNonNormalized || !validation.isValid) {
      const msg =
        validation.issues[0] ||
        "Nom de domaine invalide ou contenant des caractères non autorisés.";
      setErrorMsg(msg);
      showToast.error(msg);
      return;
    }

    if (domainsLimit !== -1 && domainsCount >= domainsLimit) {
      if (onUpgrade) onUpgrade();
      showToast.error(
        `Votre forfait est limité à ${domainsLimit} domaines. Veuillez mettre à niveau pour en ajouter davantage.`,
      );
      return;
    }

    const cleanHost = validation.normalizedSuggestion;
    setIsSubmitting(true);

    try {
      const dnsCheck = await verifyDomainExistsOnDns(cleanHost);
      if (!dnsCheck.exists) {
        const errReason =
          dnsCheck.reason ||
          `Le domaine "${cleanHost}" n'existe pas sur le réseau DNS public.`;
        setErrorMsg(errReason);
        showToast.error(errReason);
        setIsSubmitting(false);
        return;
      }

      await cfAddDomain({
        userId,
        domain: cleanHost,
        userEmail,
        userName,
        userFullName: userName,
      });

      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {}

      showToast.success(`Domaine ${cleanHost} connecté avec succès !`);
      await onCreated();
      onClose();
    } catch (err: any) {
      const msg = err.message || "Erreur lors de la connexion du domaine.";
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
            <div className="w-9 h-9 rounded-[8px] bg-[#465FFF]/10 border border-[#465FFF]/20 flex items-center justify-center text-[#465FFF] shrink-0">
              <Globe2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                Connecter un Domaine
              </h3>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 mt-0.5">
                Utilisez votre propre marque pour vos redirections courtes
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
            <div className="px-4 py-3 rounded-[8px] bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold animate-in fade-in flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Ownership & Namecheap note */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-[8px] bg-amber-500/10 border border-amber-500/25">
            <div className="flex items-start gap-2.5">
              <Info className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">
                <strong className="font-bold text-zinc-950 dark:text-white">
                  Vous devez déjà être propriétaire du domaine.
                </strong>{" "}
                LShorter connecte votre domaine via Cloudflare Edge sans vendre de noms de domaine.
              </p>
            </div>
            <a
              href={
                process.env.NEXT_PUBLIC_NAMECHEAP_AFFILIATE_LINK ||
                "https://namecheap.pxf.io/c/7999167/386170/5618"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#FF5C35] hover:bg-[#DE3723] text-white text-xs font-bold transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Acheter sur Namecheap</span>
            </a>
          </div>

          {/* Domain Input Field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="custom-domain-name-input" className="text-xs font-bold text-zinc-950 dark:text-white">
              Nom de domaine ou sous-domaine <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="custom-domain-name-input"
                required
                placeholder="ex: link.entreprise.com ou go.marque.io"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                disabled={isSubmitting}
                className="h-10 rounded-[8px] bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a] text-xs font-mono text-zinc-950 dark:text-white font-semibold pr-9"
              />
              {validation.isValid && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Validation Feedback */}
            {validation.hasNonNormalized && validation.issues.length > 0 ? (
              <div className="p-2.5 rounded-[6px] bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{validation.issues[0]}</span>
              </div>
            ) : validation.isValid ? (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Format valide : <strong className="font-bold">{validation.normalizedSuggestion}</strong></span>
              </p>
            ) : (
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Entrez un sous-domaine recommandé (ex: <code className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">link.votresite.com</code>) ou votre domaine racine.
              </span>
            )}
          </div>

          {/* DNS Configuration Preview Box */}
          <div className="p-4 rounded-[8px] bg-zinc-50 dark:bg-[#161619] border border-zinc-200/90 dark:border-[#222226] flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#465FFF]" />
              <span className="text-xs font-bold text-zinc-950 dark:text-white">
                Configuration DNS requise chez votre registrar
              </span>
            </div>
            <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
              Ajoutez un enregistrement DNS de type <strong className="text-zinc-950 dark:text-white font-bold">CNAME</strong> chez votre hébergeur (Cloudflare, OVH, Namecheap, GoDaddy...) :
            </p>
            <div className="p-2.5 rounded-[6px] bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-[#27272a] font-mono text-xs flex items-center justify-between">
              <span className="text-zinc-900 dark:text-zinc-100 font-bold">CNAME &rarr; <code className="text-[#465FFF] font-bold">cname.lsho.cc</code></span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">SSL Auto</span>
            </div>
          </div>

          {/* Quota Indicator */}
          {domainsLimit !== -1 && (
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200 px-1">
              <span>Quota de votre forfait ({plan})</span>
              <span className="font-bold text-zinc-950 dark:text-white">
                {domainsCount} / {domainsLimit} domaine{domainsLimit > 1 ? "s" : ""}
              </span>
            </div>
          )}

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
              disabled={isSubmitting || !validation.isValid}
              className="h-9 px-5 text-xs font-bold gap-1.5 shadow-md cursor-pointer disabled:opacity-50 bg-[#465FFF] hover:bg-[#3b51e6] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Vérification DNS...</span>
                </>
              ) : (
                <>
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>Connecter le Domaine</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
