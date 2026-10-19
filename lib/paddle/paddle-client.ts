"use client";

import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { getPaddlePriceId } from "@/src/config/pricing";

let paddleInstance: Paddle | null = null;
let lastInitError: string | null = null;
let cachedConfig: {
  clientToken: string;
  environment: "sandbox" | "production";
  priceIds: Record<string, { monthly: string; yearly: string }>;
  discountIds?: Record<string, { monthly: string }>;
} | null = null;

export async function fetchBillingConfig() {
  if (cachedConfig) return cachedConfig;
  try {
    const res = await fetch("/api/billing/config", { cache: "no-store" });
    if (res.ok) {
      cachedConfig = await res.json();
      return cachedConfig;
    }
  } catch (err) {
    console.warn("[Paddle] Error fetching runtime config:", err);
  }
  return null;
}

export function getPaddleInitStatus() {
  const isBlocked = lastInitError
    ? lastInitError.toLowerCase().includes("failed to load paddle.js") ||
      lastInitError.toLowerCase().includes("v1") ||
      lastInitError.toLowerCase().includes("blocked")
    : false;

  return {
    isInitialized: !!paddleInstance,
    lastError: lastInitError,
    isBlocked,
  };
}

/**
 * Initializes and retrieves the singleton Paddle.js instance on the browser.
 */
export async function getPaddleClient(): Promise<Paddle | undefined> {
  if (typeof window === "undefined") {
    return undefined;
  }

  if (paddleInstance) {
    return paddleInstance;
  }

  // 1. Try env variable, or fetch runtime config if missing/placeholder
  let token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  let env = (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || "sandbox") as "sandbox" | "production";

  if (!token || token.includes("xxxxxxxx")) {
    const dynamicConfig = await fetchBillingConfig();
    if (dynamicConfig?.clientToken && !dynamicConfig.clientToken.includes("xxxxxxxx")) {
      token = dynamicConfig.clientToken;
      env = dynamicConfig.environment || "sandbox";
    }
  }

  if (!token || token.includes("xxxxxxxx")) {
    console.warn(
      "[Paddle.js] Client Token not found or set to default placeholder. Checkout will fallback to server-side checkout."
    );
    return undefined;
  }

  try {
    const instance = await initializePaddle({
      environment: env,
      token,
      eventCallback: (event) => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("lshorter_paddle_event", { detail: event }));
        }
      },
    });
    paddleInstance = instance || null;
    lastInitError = null;
    return paddleInstance || undefined;
  } catch (initErr: any) {
    console.error("[Paddle.js] initializePaddle error:", initErr);
    lastInitError = initErr?.message || "Failed to load Paddle.js";
    return undefined;
  }
}

export interface OpenPaddleCheckoutOptions {
  planId: "PRO" | "BUSINESS" | "ENTERPRISE";
  cycle: "MONTHLY" | "YEARLY";
  userId?: string;
  userEmail?: string;
  theme?: "light" | "dark";
  onSuccess?: () => void;
  onClose?: () => void;
}

export interface OpenPaddleCheckoutResult {
  success: boolean;
  error?: string;
  isAdBlocked?: boolean;
}

/**
 * Redirects to the dedicated LShorter inline checkout page (/checkout)
 * where the user gets a clean Light/Dark theme-aware payment experience.
 */
export async function openPaddleCheckout(
  options: OpenPaddleCheckoutOptions
): Promise<OpenPaddleCheckoutResult> {
  const { planId, cycle } = options;

  if (typeof window !== "undefined") {
    const fromPath = window.location.pathname || "/dashboard/pricing";
    const params = new URLSearchParams({
      plan: planId,
      cycle,
      from: fromPath,
    });
    window.location.href = `/checkout?${params.toString()}`;
    return { success: true };
  }

  return {
    success: false,
    error: "Navigation impossible côté serveur.",
  };
}

