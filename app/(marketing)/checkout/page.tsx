"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Lock,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { PRICING_PLANS, getPaddlePriceId } from "@/src/config/pricing";
import {
  fetchBillingConfig,
  getPaddleClient,
  getPaddleInitStatus,
} from "@/lib/paddle/paddle-client";
import { showToast } from "@/components/ui/toast-provider";
import confetti from "canvas-confetti";

type PaidPlanId = "PRO" | "BUSINESS" | "ENTERPRISE";
type BillingCycle = "MONTHLY" | "YEARLY";

interface LiveCheckoutTotals {
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

const PLAN_FEATURES: Record<PaidPlanId, string[]> = {
  PRO: [
    "150 000 clics / mois inclus (+3 $ / 50k clics suppl.)",
    "6 domaines personnalisés avec SSL Cloudflare automatique",
    "1 000 liens courts actifs & QR Code Studio complet",
    "Smart Routing dynamique (Pays, Appareil, OS, Langue)",
    "Protection par code PIN (PathLock™) & Link Cloaking",
    "5 Pixels de retargeting & 5 Webhooks temps réel",
  ],
  BUSINESS: [
    "500 000 clics / mois inclus (+8 $ / 125k clics suppl.)",
    "15 domaines personnalisés & liens courts illimités",
    "Moteur de règles Smart Routing multi-conditions sur mesure",
    "Pixels de retargeting & Webhooks illimités",
    "Rétention analytique illimitée & export CSV/Excel",
    "5 membres d'équipe inclus & factures PDF certifiées",
  ],
  ENTERPRISE: [
    "Clics mensuels illimités (0 $ de frais de dépassement)",
    "Domaines personnalisés & liens actifs illimités",
    "Infrastructure Edge haute fréquence dédiée (SLA 99,99 %)",
    "Jusqu'à 15 membres d'équipe & contrôle d'accès avancé",
    "API Développeur haute cadence (1 400 req/min)",
    "Support prioritaire dédié & facturation certifiée",
  ],
};

function formatDateFr(monthsFromNow: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsFromNow);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: number): string {
  return amount.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function CheckoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();

  const rawPlan = (searchParams.get("plan") || "PRO").toUpperCase();
  const initialPlan: PaidPlanId =
    rawPlan === "BUSINESS" || rawPlan === "ENTERPRISE" ? rawPlan : "PRO";

  const rawCycle = (searchParams.get("cycle") || "MONTHLY").toUpperCase();
  const initialCycle: BillingCycle = rawCycle === "YEARLY" ? "YEARLY" : "MONTHLY";

  const urlPtxn = searchParams.get("_ptxn") || searchParams.get("ptxn") || "";
  const fromPath = searchParams.get("from") || "/dashboard/pricing";

  const [selectedPlan, setSelectedPlan] = useState<PaidPlanId>(initialPlan);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>(initialCycle);
  const [activeTransactionId, setActiveTransactionId] = useState<string>(urlPtxn);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState<boolean>(true);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isAdBlocked, setIsAdBlocked] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [liveTotals, setLiveTotals] = useState<LiveCheckoutTotals | null>(null);

  const usedInitialUrlPtxnRef = useRef<boolean>(false);
  const completedRef = useRef<boolean>(false);

  const userId = session?.user?.id || "";
  const userEmail = session?.user?.email || "";

  // Redirect unauthenticated users (unless opening a direct Paddle transaction link)
  useEffect(() => {
    if (status === "unauthenticated" && !urlPtxn) {
      const target = `/checkout?plan=${selectedPlan}&cycle=${selectedCycle}`;
      router.replace(`/login?redirect=${encodeURIComponent(target)}`);
    }
  }, [status, urlPtxn, selectedPlan, selectedCycle, router]);

  // Calculate default summary pricing from PRICING_PLANS
  const planDef = PRICING_PLANS[selectedPlan] || PRICING_PLANS.PRO;

  const calculatedPricing = useMemo(() => {
    if (selectedCycle === "MONTHLY") {
      const subtotal = planDef.monthlyPrice;
      const totalToday = planDef.promoMonthly.firstMonthPrice;
      const discount = Math.max(0, Number((subtotal - totalToday).toFixed(2)));
      return {
        subtotal,
        discount,
        discountPercent: planDef.promoMonthly.discountPercent,
        tax: 0,
        totalToday,
        recurringAfterPromo: planDef.monthlyPrice,
        promoDurationMonths: planDef.promoMonthly.durationMonths || 2,
      };
    } else {
      const subtotal = planDef.promoYearly.fullPriceBeforeDiscount;
      const totalToday = planDef.yearlyPrice;
      const discount = Math.max(0, Number((subtotal - totalToday).toFixed(2)));
      return {
        subtotal,
        discount,
        discountPercent: planDef.promoYearly.discountPercent,
        tax: 0,
        totalToday,
        recurringAfterPromo: planDef.yearlyPrice,
        promoDurationMonths: 12,
      };
    }
  }, [planDef, selectedCycle]);

  // Listen to Paddle.js events (checkout.loaded, checkout.updated, checkout.completed, checkout.error)
  useEffect(() => {
    const handlePaddleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      const event = customEvent.detail;
      if (!event?.name) return;

      if (
        event.name === "checkout.loaded" ||
        event.name === "checkout.updated" ||
        event.name === "checkout.discount.applied" ||
        event.name === "checkout.discount.removed"
      ) {
        setIsLoadingCheckout(false);
        setCheckoutError(null);

        const totals = event.data?.totals;
        if (totals && typeof totals.total === "number") {
          const rawSubtotal = Number(totals.subtotal ?? calculatedPricing.subtotal);
          const scale =
            calculatedPricing.subtotal > 0 && rawSubtotal > calculatedPricing.subtotal * 10
              ? 100
              : 1;
          setLiveTotals({
            currency: event.data?.currency_code || "USD",
            subtotal: rawSubtotal / scale,
            discount: Number(totals.discount ?? calculatedPricing.discount * scale) / scale,
            tax: Number(totals.tax ?? 0) / scale,
            total: Number(totals.total) / scale,
          });
        }
      }

      if (event.name === "checkout.completed" && !completedRef.current) {
        completedRef.current = true;
        const txId = event.data?.transaction_id || activeTransactionId;
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
        showToast.success(`Paiement validé ! Activation de votre forfait ${planDef.name}...`);

        if (txId) {
          fetch("/api/billing/verify-transaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transactionId: txId, userId }),
          }).finally(() => {
            router.push(
              `/dashboard/settings?tab=billing&checkout_success=true&plan=${selectedPlan}&ptxn=${encodeURIComponent(txId)}`
            );
          });
        } else {
          router.push(`/dashboard/settings?tab=billing&checkout_success=true&plan=${selectedPlan}`);
        }
      }

      if (event.name === "checkout.error") {
        console.warn("[Paddle Inline Checkout Error]:", event);
      }
    };

    window.addEventListener("lshorter_paddle_event", handlePaddleEvent);
    return () => {
      window.removeEventListener("lshorter_paddle_event", handlePaddleEvent);
    };
  }, [activeTransactionId, calculatedPricing, planDef.name, router, selectedPlan, userId]);

  // Initialize and mount Paddle Inline Checkout whenever plan, cycle, theme, or retry changes
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" && !urlPtxn) return;

    let cancelled = false;
    let observer: MutationObserver | null = null;
    setIsLoadingCheckout(true);
    setCheckoutError(null);
    setIsAdBlocked(false);
    setLiveTotals(null);

    const mountInlineCheckout = async () => {
      // Wait a frame so the fresh #paddle-inline-checkout container is mounted in DOM
      await new Promise((r) => setTimeout(r, 60));
      if (cancelled) return;

      const dynamicConfig = await fetchBillingConfig();
      const paddle = await getPaddleClient();
      const initStatus = getPaddleInitStatus();

      if (cancelled) return;

      if (!paddle) {
        setIsLoadingCheckout(false);
        if (initStatus.isBlocked) {
          setIsAdBlocked(true);
          setCheckoutError(
            "Le module de paiement sécurisé Paddle (cdn.paddle.com) est bloqué par une extension de votre navigateur (AdBlock, uBlock ou Brave Shields). Veuillez le désactiver pour afficher le formulaire."
          );
        } else {
          setCheckoutError(
            "Impossible d'initialiser le formulaire de paiement Paddle. Vérifiez votre connexion ou réessayez."
          );
        }
        return;
      }

      // Watch #paddle-inline-checkout for iframe insertion to hide skeleton smoothly
      const containerEl = document.getElementById("paddle-inline-checkout");
      if (containerEl) {
        containerEl.innerHTML = "";
        observer = new MutationObserver(() => {
          const iframe = containerEl.querySelector("iframe");
          if (iframe) {
            iframe.style.borderRadius = "8px";
            iframe.addEventListener("load", () => {
              if (!cancelled) setIsLoadingCheckout(false);
            });
          }
        });
        observer.observe(containerEl, { childList: true, subtree: true });
      }

      const inlineSettings = {
        displayMode: "inline" as const,
        frameTarget: "paddle-inline-checkout",
        frameInitialHeight: 510,
        frameStyle:
          "width: 100%; min-width: 280px; background-color: transparent; border: none; border-radius: 8px;",
        theme: (theme === "dark" ? "dark" : "light") as "dark" | "light",
        variant: "one-page" as const,
        locale: "fr",
      };

      // Case 1: Direct transaction ID from URL on initial load
      if (urlPtxn && !usedInitialUrlPtxnRef.current) {
        usedInitialUrlPtxnRef.current = true;
        setActiveTransactionId(urlPtxn);
        try {
          paddle.Checkout.open({
            transactionId: urlPtxn,
            settings: {
              ...inlineSettings,
              successUrl: `${window.location.origin}/dashboard/settings?tab=billing&checkout_success=true&plan=${selectedPlan}&ptxn=${urlPtxn}`,
            },
          });
          setTimeout(() => {
            if (!cancelled) setIsLoadingCheckout(false);
          }, 2200);
          return;
        } catch (err: any) {
          console.warn("[Paddle Inline] Failed opening URL ptxn, creating new session:", err);
        }
      }

      // Resolve priceId and discountId
      let priceId = getPaddlePriceId(selectedPlan, selectedCycle);
      if (
        (!priceId ||
          priceId.startsWith("pri_pro_") ||
          priceId.startsWith("pri_biz_") ||
          priceId.startsWith("pri_ent_") ||
          priceId.startsWith("pri_business_") ||
          priceId.startsWith("pri_enterprise_")) &&
        dynamicConfig?.priceIds
      ) {
        const planPrices = dynamicConfig.priceIds[selectedPlan];
        if (planPrices) {
          priceId = selectedCycle === "YEARLY" ? planPrices.yearly : planPrices.monthly;
        }
      }

      let discountId: string | undefined = undefined;
      if (selectedCycle === "MONTHLY") {
        if (selectedPlan === "PRO")
          discountId = process.env.NEXT_PUBLIC_PADDLE_DISCOUNT_PRO_MONTHLY;
        else if (selectedPlan === "BUSINESS")
          discountId = process.env.NEXT_PUBLIC_PADDLE_DISCOUNT_BUSINESS_MONTHLY;
        else if (selectedPlan === "ENTERPRISE")
          discountId = process.env.NEXT_PUBLIC_PADDLE_DISCOUNT_ENTERPRISE_MONTHLY;

        if (!discountId && dynamicConfig?.discountIds) {
          discountId = dynamicConfig.discountIds[selectedPlan]?.monthly;
        }
      }

      // Case 2: Create server-side transaction first
      try {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: selectedPlan,
            cycle: selectedCycle,
            userId,
            discountId,
            customerEmail: userEmail || undefined,
            successUrl: `${window.location.origin}/dashboard/settings?tab=billing&checkout_success=true&plan=${selectedPlan}`,
            cancelUrl: `${window.location.origin}/checkout?plan=${selectedPlan}&cycle=${selectedCycle}`,
          }),
        });

        const data = await res.json();
        if (cancelled) return;

        if (
          data.success &&
          data.transactionId &&
          !data.transactionId.startsWith("txn_paddle_dev_")
        ) {
          setActiveTransactionId(data.transactionId);
          paddle.Checkout.open({
            transactionId: data.transactionId,
            settings: {
              ...inlineSettings,
              successUrl: `${window.location.origin}/dashboard/settings?tab=billing&checkout_success=true&plan=${selectedPlan}&ptxn=${data.transactionId}`,
            },
          });
          setTimeout(() => {
            if (!cancelled) setIsLoadingCheckout(false);
          }, 2200);
          return;
        }
      } catch (apiErr) {
        console.warn("[Paddle Inline] Server transaction creation fallback to client items:", apiErr);
      }

      if (cancelled) return;

      // Case 3: Fallback to direct client-side items open
      if (priceId && !priceId.includes("pri_pro_monthly")) {
        try {
          paddle.Checkout.open({
            items: [{ priceId, quantity: 1 }],
            discountId: discountId || undefined,
            customData: {
              userId: userId || "",
              planId: selectedPlan,
              cycle: selectedCycle,
            },
            customer: userEmail ? { email: userEmail } : undefined,
            settings: {
              ...inlineSettings,
              successUrl: `${window.location.origin}/dashboard/settings?tab=billing&checkout_success=true&plan=${selectedPlan}`,
            },
          });
          setTimeout(() => {
            if (!cancelled) setIsLoadingCheckout(false);
          }, 2200);
          return;
        } catch (clientErr: any) {
          if (!cancelled) {
            setIsLoadingCheckout(false);
            setCheckoutError(
              clientErr?.message || "Impossible de charger le formulaire de paiement Paddle."
            );
          }
          return;
        }
      }

      if (!cancelled) {
        setIsLoadingCheckout(false);
        setCheckoutError(
          "Configuration de prix Paddle introuvable pour ce forfait. Vérifiez vos variables d'environnement Paddle."
        );
      }
    };

    mountInlineCheckout();

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [
    status,
    selectedPlan,
    selectedCycle,
    theme,
    retryCount,
    urlPtxn,
    userId,
    userEmail,
  ]);

  const handlePlanChange = (newPlan: PaidPlanId) => {
    if (newPlan === selectedPlan) return;
    usedInitialUrlPtxnRef.current = true;
    setSelectedPlan(newPlan);
  };

  const handleCycleChange = (newCycle: BillingCycle) => {
    if (newCycle === selectedCycle) return;
    usedInitialUrlPtxnRef.current = true;
    setSelectedCycle(newCycle);
  };

  const displaySubtotal = liveTotals ? liveTotals.subtotal : calculatedPricing.subtotal;
  const displayDiscount = liveTotals ? liveTotals.discount : calculatedPricing.discount;
  const displayTax = liveTotals ? liveTotals.tax : calculatedPricing.tax;
  const displayTotal = liveTotals ? liveTotals.total : calculatedPricing.totalToday;

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200 flex flex-col">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 w-full bg-white dark:bg-[#111114] border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={fromPath}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Retour aux tarifs</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <div className="w-7 h-7 rounded-[6px] bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                L
              </div>
              <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white">
                LShorter
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Paiement sécurisé SSL · PCI-DSS</span>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] text-xs sm:text-sm font-medium bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors cursor-pointer"
              aria-label="Basculer le thème clair ou sombre"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="hidden xs:inline">Mode Clair</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-zinc-700 shrink-0" />
                  <span className="hidden xs:inline">Mode Sombre</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT COLUMN: Plan Switcher, Order Summary & Features */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* 1. Plan & Cycle Selector */}
            <div className="rounded-[10px] bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2.5">
                Forfait sélectionné
              </div>

              {/* Plan Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-[8px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
                {(["PRO", "BUSINESS", "ENTERPRISE"] as PaidPlanId[]).map((planKey) => {
                  const isActive = selectedPlan === planKey;
                  return (
                    <button
                      key={planKey}
                      type="button"
                      onClick={() => handlePlanChange(planKey)}
                      className={`py-2 px-2 rounded-[6px] text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      {PRICING_PLANS[planKey].name}
                    </button>
                  );
                })}
              </div>

              {/* Billing Cycle Tabs */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => handleCycleChange("MONTHLY")}
                  className={`flex items-center justify-between px-3 py-2 rounded-[8px] border text-xs font-medium transition-colors cursor-pointer ${
                    selectedCycle === "MONTHLY"
                      ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <span>Mensuel</span>
                  <span className="px-1.5 py-0.5 rounded-[6px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                    -{planDef.promoMonthly.discountPercent}%
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCycleChange("YEARLY")}
                  className={`flex items-center justify-between px-3 py-2 rounded-[8px] border text-xs font-medium transition-colors cursor-pointer ${
                    selectedCycle === "YEARLY"
                      ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <span>Annuel</span>
                  <span className="px-1.5 py-0.5 rounded-[6px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                    -{planDef.promoYearly.discountPercent}%
                  </span>
                </button>
              </div>
            </div>

            {/* 2. Price Breakdown Card */}
            <div className="rounded-[10px] bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6">
              <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Montant à régler aujourd&apos;hui
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    {formatAmount(displayTotal)} $US
                  </span>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    maintenant
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  LShorter {planDef.name} ({selectedCycle === "YEARLY" ? "Facturation annuelle" : "Facturation mensuelle"})
                </p>
              </div>

              {/* Lines */}
              <div className="py-4 space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Sous-total</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-200">
                    {formatAmount(displaySubtotal)} $US
                  </span>
                </div>

                {displayDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Remise promotionnelle (-{calculatedPricing.discountPercent}%)</span>
                    <span className="font-semibold">-{formatAmount(displayDiscount)} $US</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span>TVA / Taxes</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-200">
                    {formatAmount(displayTax)} $US
                  </span>
                </div>

                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
                  <span>Total aujourd&apos;hui</span>
                  <span>{formatAmount(displayTotal)} $US</span>
                </div>
              </div>

              {/* Future Billing Schedule */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                {selectedCycle === "MONTHLY" ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span>À payer le {formatDateFr(1)}</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {formatAmount(planDef.promoMonthly.firstMonthPrice)} $US
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>À partir du {formatDateFr(2)}</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {formatAmount(planDef.monthlyPrice)} $US / mois
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span>Renouvellement annuel ({formatDateFr(12)})</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {formatAmount(planDef.yearlyPrice)} $US / an
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 pt-1">
                  Si vous n&apos;annulez pas avant cette date. Résiliation en 1 clic à tout moment.
                </p>
              </div>
            </div>

            {/* 3. Plan Features List */}
            <div className="rounded-[10px] bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                Inclus dans LShorter {planDef.name}
              </div>
              <ul className="space-y-2.5">
                {PLAN_FEATURES[selectedPlan].map((feat, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <div className="mt-0.5 w-4 h-4 rounded-[6px] bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT COLUMN: Paddle Inline Payment Form */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="rounded-[10px] bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6">
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[8px] bg-blue-600/10 dark:bg-blue-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h1 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                      Informations de paiement
                    </h1>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Carte bancaire ou PayPal · Traitement sécurisé PCI-DSS
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-[6px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[11px] font-medium">
                  Chiffrement 256-bit
                </span>
              </div>

              {/* Error or AdBlocker Alert */}
              {checkoutError && (
                <div className="mb-4 p-4 rounded-[8px] bg-red-500/10 border border-red-500/25 text-red-700 dark:text-red-300 text-xs space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {isAdBlocked
                          ? "Bloqueur de publicité détecté"
                          : "Erreur de chargement du paiement"}
                      </p>
                      <p className="text-red-600/90 dark:text-red-300/90 leading-relaxed">
                        {checkoutError}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRetryCount((c) => c + 1)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Réessayer</span>
                  </button>
                </div>
              )}

              {/* Paddle Inline Target Container + Skeleton Overlay */}
              <div className="relative min-h-[480px] w-full">
                {isLoadingCheckout && !checkoutError && (
                  <div
                    className="absolute inset-0 z-10 bg-white dark:bg-[#111114] space-y-4 py-2 animate-pulse"
                    aria-busy="true"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-12 rounded-[8px] bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800" />
                      <div className="h-12 rounded-[8px] bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-28 rounded-[6px] bg-zinc-200 dark:bg-zinc-800" />
                      <div className="h-10 w-full rounded-[8px] bg-zinc-100 dark:bg-zinc-800/80" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-36 rounded-[6px] bg-zinc-200 dark:bg-zinc-800" />
                      <div className="h-10 w-full rounded-[8px] bg-zinc-100 dark:bg-zinc-800/80" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-32 rounded-[6px] bg-zinc-200 dark:bg-zinc-800" />
                      <div className="h-20 w-full rounded-[8px] bg-zinc-100 dark:bg-zinc-800/80" />
                    </div>
                    <div className="h-11 w-full rounded-[8px] bg-blue-600/40 dark:bg-blue-500/30 mt-2" />
                  </div>
                )}

                <div
                  key={`paddle-inline-${selectedPlan}-${selectedCycle}-${theme}-${retryCount}`}
                  id="paddle-inline-checkout"
                  className={`paddle-inline-checkout w-full min-h-[480px] transition-opacity duration-200 ${
                    isLoadingCheckout ? "opacity-0" : "opacity-100"
                  }`}
                />
              </div>

              {/* Security & Compliance Footer */}
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    Vos coordonnées bancaires sont traitées dans une iframe isolée certifiée PCI-DSS Niveau 1.
                  </span>
                </div>
                <Link
                  href="/terms"
                  className="underline hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0"
                >
                  Conditions de vente
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-[#F8FAFC] dark:bg-[#09090B] flex items-center justify-center p-6">
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
            <div className="lg:col-span-5 h-[480px] rounded-[10px] bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800" />
            <div className="lg:col-span-7 h-[540px] rounded-[10px] bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800" />
          </div>
        </div>
      }
    >
      <CheckoutPageInner />
    </Suspense>
  );
}
