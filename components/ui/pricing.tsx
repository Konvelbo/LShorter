"use client";

import { buttonVariants } from "@/components/ui/button";
import { WaveRevealButton } from "@/components/ui/wave-reveal-button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Check, Loader2, Star } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";

export type PaidPlanId = "PRO" | "BUSINESS" | "ENTERPRISE";
export type BillingCycle = "MONTHLY" | "YEARLY";

export interface PricingPlan {
  planId?: "FREE" | PaidPlanId;
  name: string;
  price: number;
  yearlyPrice: number;
  monthlyOriginalPrice?: number;
  yearlyOriginalPrice?: number;
  period: string;
  yearlyPeriod?: string;
  monthlyBillingNote?: string;
  yearlyBillingNote?: string;
  monthlySavings?: string;
  yearlySavings?: string;
  badgeMonthly?: string;
  badgeYearly?: string;
  features: string[];
  notIncludedNote?: string;
  description: string;
  buttonText: string;
  href: string;
  yearlyHref?: string;
  isPopular: boolean;
}

export interface EnterpriseBannerPlan {
  planId?: "ENTERPRISE";
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyOriginalPrice: number;
  yearlyOriginalPrice: number;
  monthlyBillingNote: string;
  yearlyBillingNote: string;
  description: string;
  features: string[];
  buttonText: string;
  monthlyHref: string;
  yearlyHref: string;
}

export interface PricingProps {
  plans: PricingPlan[];
  enterprise?: EnterpriseBannerPlan;
  title?: string;
  description?: string;
  annualSaveLabel?: string;
  onSelectPlan?: (planId: PaidPlanId, cycle: BillingCycle) => void | Promise<void>;
  loadingPlan?: string | null;
}

export function Pricing({
  plans,
  enterprise,
  title = "Simple, Transparent Pricing",
  description = "Choose the plan that works for you.\nAll plans run on Cloudflare's 310+ global edge PoPs with instant PDF invoices.",
  annualSaveLabel = "Save up to 50%",
  onSelectPlan,
  loadingPlan,
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const switchRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: ["#0066FF", "#5294FF", "#002E99", "#10B981"],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-[32px] sm:text-[44px] font-semibold tracking-[-0.03em] leading-[1.08] text-[#09090B] dark:text-white text-balance">
          {title}
        </h2>
        <p className="text-[#52525B] dark:text-zinc-400 text-[15.5px] sm:text-[17px] leading-[1.6] whitespace-pre-line max-w-[620px] mx-auto">
          {description}
        </p>
      </div>

      {/* Interactive Switch with Confetti */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
        <span
          className={cn(
            "text-[14px] font-medium transition-colors",
            isMonthly
              ? "text-[#09090B] dark:text-white"
              : "text-[#71717A] dark:text-zinc-400"
          )}
        >
          Monthly{" "}
          <span className="text-emerald-600 dark:text-emerald-400 text-[12.5px] font-medium">
            (-75% first 2 mo)
          </span>
        </span>
        <div className="relative inline-flex items-center">
          <Switch
            id="pricing-billing-switch"
            ref={switchRef}
            checked={!isMonthly}
            onCheckedChange={handleToggle}
            aria-label="Toggle annual billing"
            className="relative cursor-pointer"
          />
          <Label htmlFor="pricing-billing-switch" className="sr-only">
            Toggle annual billing
          </Label>
        </div>
        <span
          className={cn(
            "text-[14px] font-semibold transition-colors",
            !isMonthly
              ? "text-[#09090B] dark:text-white"
              : "text-[#52525B] dark:text-zinc-300"
          )}
        >
          Annual billing{" "}
          <span className="text-[#0066FF] dark:text-[#6CA8FF]">
            ({annualSaveLabel})
          </span>
        </span>
      </div>

      {/* 3-Column Elevated Podium Cards (strictly rounded-[10px]) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {plans.map((plan, index) => {
          const activePrice = isMonthly ? plan.price : plan.yearlyPrice;
          const activeOriginal = isMonthly
            ? plan.monthlyOriginalPrice
            : plan.yearlyOriginalPrice;
          const activePeriod = isMonthly
            ? plan.period
            : plan.yearlyPeriod || plan.period;
          const activeNote = isMonthly
            ? plan.monthlyBillingNote || "billed monthly"
            : plan.yearlyBillingNote || "billed annually";
          const activeSavings = isMonthly
            ? plan.monthlySavings
            : plan.yearlySavings;
          const activeBadge = isMonthly
            ? plan.badgeMonthly
            : plan.badgeYearly;
          const activeHref = !isMonthly && plan.yearlyHref ? plan.yearlyHref : plan.href;
          const hasDecimals = !Number.isInteger(activePrice);

          return (
            <motion.div
              key={plan.name}
              initial={{ y: 36, opacity: 1 }}
              whileInView={
                isDesktop
                  ? {
                      y: plan.isPopular ? -20 : 0,
                      opacity: 1,
                      x: index === 2 ? -24 : index === 0 ? 24 : 0,
                      scale: index === 0 || index === 2 ? 0.94 : 1.0,
                    }
                  : { y: 0, opacity: 1 }
              }
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 1.4,
                type: "spring",
                stiffness: 100,
                damping: 30,
                delay: 0.15,
                opacity: { duration: 0.45 },
              }}
              className={cn(
                "rounded-[10px] border p-6 sm:p-7 bg-white dark:bg-[#111216] text-center flex flex-col relative overflow-hidden",
                plan.isPopular
                  ? "border-[#0066FF] border-2 shadow-[0_18px_50px_rgba(0,102,255,0.14)] dark:shadow-[0_22px_56px_rgba(0,102,255,0.22)]"
                  : "border-[#E4E7EC] dark:border-white/[0.10]",
                !plan.isPopular && "md:mt-5",
                index === 0 || index === 2 ? "z-0" : "z-10",
                index === 0 && "md:origin-right",
                index === 2 && "md:origin-left"
              )}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-[#0066FF] py-1 px-2.5 rounded-bl-[8px] rounded-tr-[8px] flex items-center">
                  <Star className="text-white h-3.5 w-3.5 fill-current" />
                  <span className="text-white ml-1 text-[12px] font-semibold">
                    Popular
                  </span>
                </div>
              )}

              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-[15px] font-semibold text-[#52525B] dark:text-zinc-300">
                    {plan.name}
                  </p>
                  {activeBadge && (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-[5px] text-[11px] font-semibold",
                        plan.isPopular
                          ? "bg-[#0066FF]/12 text-[#0066FF] dark:text-[#6CA8FF]"
                          : "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                      )}
                    >
                      {activeBadge}
                    </span>
                  )}
                </div>

                {/* Animated NumberFlow Price */}
                <div className="mt-5 flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-1">
                  <span className="text-[42px] sm:text-[46px] font-bold tracking-tight leading-none text-[#09090B] dark:text-white tabular-nums">
                    <NumberFlow
                      locales="en-US"
                      value={activePrice}
                      format={{
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: hasDecimals ? 2 : 0,
                        maximumFractionDigits: hasDecimals ? 2 : 0,
                      }}
                      transformTiming={{
                        duration: 500,
                        easing: "ease-out",
                      }}
                      willChange
                    />
                  </span>
                  {activePeriod && (
                    <span className="text-[13px] font-semibold text-[#71717A] dark:text-zinc-400 whitespace-nowrap">
                      / {activePeriod}
                    </span>
                  )}
                  {activeOriginal !== undefined && activeOriginal > 0 && (
                    <span className="text-[14px] font-medium line-through text-[#A1A1AA] dark:text-zinc-500 tabular-nums whitespace-nowrap">
                      ${activeOriginal}
                    </span>
                  )}
                </div>

                <div className="mt-2 min-h-[36px] flex flex-col items-center justify-center">
                  {activeSavings && (
                    <p className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 leading-tight">
                      {activeSavings}
                    </p>
                  )}
                  <p className="text-[12px] leading-5 text-[#71717A] dark:text-zinc-400">
                    {activeNote}
                  </p>
                </div>

                <ul className="mt-5 gap-2.5 flex flex-col flex-1 text-[13.5px] text-[#3F3F46] dark:text-zinc-300">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[#0066FF] dark:text-[#6CA8FF] mt-0.5 flex-shrink-0" />
                      <span className="text-left leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.notIncludedNote && (
                  <p className="mt-4 text-[11.5px] text-left leading-relaxed text-[#71717A] dark:text-zinc-500">
                    {plan.notIncludedNote}
                  </p>
                )}

                <hr className="w-full my-5 border-[#E4E7EC] dark:border-white/[0.08]" />

                {onSelectPlan && plan.planId && plan.planId !== "FREE" ? (
                  plan.isPopular ? (
                    <WaveRevealButton
                      type="button"
                      variant="primary"
                      size="md"
                      wave
                      disabled={Boolean(loadingPlan)}
                      showArrow={loadingPlan !== plan.planId}
                      icon={
                        loadingPlan === plan.planId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : undefined
                      }
                      onClick={() =>
                        onSelectPlan(
                          plan.planId as PaidPlanId,
                          isMonthly ? "MONTHLY" : "YEARLY"
                        )
                      }
                      className="w-full text-[14.5px]"
                    >
                      {loadingPlan === plan.planId
                        ? "Redirecting..."
                        : plan.buttonText}
                    </WaveRevealButton>
                  ) : (
                    <button
                      type="button"
                      disabled={Boolean(loadingPlan)}
                      onClick={() =>
                        onSelectPlan(
                          plan.planId as PaidPlanId,
                          isMonthly ? "MONTHLY" : "YEARLY"
                        )
                      }
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "group relative w-full h-11 gap-2 overflow-hidden rounded-[10px] text-[14.5px] font-semibold tracking-tight cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed",
                        "transform-gpu transition-[background-color,border-color,box-shadow,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] btn-hover-slow",
                        "bg-white dark:bg-white/[0.04] text-[#09090B] dark:text-white border-[#D4D4D8] dark:border-white/[0.14] hover:bg-[#0066FF] hover:text-white hover:border-[#0066FF]"
                      )}
                    >
                      {loadingPlan === plan.planId ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Redirecting...</span>
                        </>
                      ) : (
                        plan.buttonText
                      )}
                    </button>
                  )
                ) : plan.isPopular ? (
                  <WaveRevealButton
                    href={activeHref}
                    variant="primary"
                    size="md"
                    wave
                    className="w-full text-[14.5px]"
                  >
                    {plan.buttonText}
                  </WaveRevealButton>
                ) : (
                  <Link
                    href={activeHref}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "group relative w-full h-11 gap-2 overflow-hidden rounded-[10px] text-[14.5px] font-semibold tracking-tight",
                      "transform-gpu transition-[background-color,border-color,box-shadow,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] btn-hover-slow",
                      "bg-white dark:bg-white/[0.04] text-[#09090B] dark:text-white border-[#D4D4D8] dark:border-white/[0.14] hover:bg-[#0066FF] hover:text-white hover:border-[#0066FF]"
                    )}
                  >
                    {plan.buttonText}
                  </Link>
                )}
                <p className="mt-4 text-[12px] leading-5 text-[#71717A] dark:text-zinc-400">
                  {plan.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Real Enterprise Plan Horizontal Card */}
      {enterprise && (
        <article className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-8 lg:gap-12 p-6 sm:p-10 rounded-[10px] bg-white dark:bg-[#111113] border border-[#E4E7EC] dark:border-[#222225] text-left transition-colors duration-300">
          <div>
            <div className="flex items-baseline gap-3">
              <h3 className="m-0 font-medium text-[20px] leading-[28px] text-[#101828] dark:text-[#FAFAFA]">
                {enterprise.name}
              </h3>
              <span className="text-[13px] leading-[16px] text-[#15803D] dark:text-[#4ADE80]">
                {isMonthly ? "−50% promo" : "−30% annual"}
              </span>
            </div>

            <p className="mt-2 text-[16px] leading-[24px] text-[#344054] dark:text-[#D4D4D8]">
              {enterprise.description}
            </p>

            <div className="mt-7 flex flex-wrap items-baseline gap-2">
              <span className="font-medium text-[44px] sm:text-[48px] leading-[56px] tracking-[-0.02em] tabular-nums text-[#101828] dark:text-[#FAFAFA]">
                <NumberFlow
                  locales="en-US"
                  value={isMonthly ? enterprise.monthlyPrice : enterprise.yearlyPrice}
                  format={{
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: isMonthly ? 2 : 0,
                    maximumFractionDigits: isMonthly ? 2 : 0,
                  }}
                  transformTiming={{ duration: 500, easing: "ease-out" }}
                  willChange
                />
              </span>
              <span className="text-[16px] text-[#667085] dark:text-[#A1A1AA]">
                / {isMonthly ? "2 mo" : "yr"}
              </span>
              <span className="text-[16px] line-through tabular-nums text-[#667085] dark:text-[#A1A1AA]">
                ${(isMonthly ? enterprise.monthlyOriginalPrice : enterprise.yearlyOriginalPrice).toLocaleString("en-US")}
              </span>
            </div>

            <p className="mt-1 text-[14px] leading-[20px] text-[#667085] dark:text-[#A1A1AA]">
              {isMonthly ? enterprise.monthlyBillingNote : enterprise.yearlyBillingNote}
            </p>

            {onSelectPlan ? (
              <button
                type="button"
                disabled={Boolean(loadingPlan)}
                onClick={() =>
                  onSelectPlan(
                    enterprise.planId || "ENTERPRISE",
                    isMonthly ? "MONTHLY" : "YEARLY"
                  )
                }
                className="inline-flex items-center gap-2 h-[44px] mt-6 px-5 rounded-[10px] border border-[#D0D5DD] dark:border-[#2E2E33] text-[15px] font-medium leading-none text-[#101828] dark:text-[#FAFAFA] hover:bg-[#101828]/[0.05] dark:hover:bg-[#FAFAFA]/[0.06] transition-[background-color,border-color,box-shadow,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] btn-hover-slow cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#0066FF] focus-visible:outline-offset-2"
              >
                {loadingPlan === (enterprise.planId || "ENTERPRISE") ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Redirecting...</span>
                  </>
                ) : (
                  enterprise.buttonText
                )}
              </button>
            ) : (
              <Link
                href={isMonthly ? enterprise.monthlyHref : enterprise.yearlyHref}
                className="inline-flex items-center h-[44px] mt-6 px-5 rounded-[10px] border border-[#D0D5DD] dark:border-[#2E2E33] text-[15px] font-medium leading-none text-[#101828] dark:text-[#FAFAFA] hover:bg-[#101828]/[0.05] dark:hover:bg-[#FAFAFA]/[0.06] transition-[background-color,border-color,box-shadow,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] btn-hover-slow focus-visible:outline-2 focus-visible:outline-[#0066FF] focus-visible:outline-offset-2"
              >
                {enterprise.buttonText}
              </Link>
            )}
          </div>

          <div className="flex items-center pt-8 lg:pt-0 lg:pl-12 border-t lg:border-t-0 lg:border-l border-[#E4E7EC] dark:border-[#222225]">
            <ul className="list-none m-0 p-0 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {enterprise.features.map((feat) => (
                <li
                  key={feat}
                  className="grid grid-cols-[20px_minmax(0,1fr)] gap-3 text-[15px] leading-[24px] text-[#101828] dark:text-[#FAFAFA]"
                >
                  <Check className="w-5 h-5 mt-0.5 text-[#667085] dark:text-[#A1A1AA] stroke-[1.5]" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      )}
    </div>
  );
}
