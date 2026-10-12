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

async function fetchBillingConfig() {
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
 * Opens Paddle Checkout overlay or redirects to transaction checkout URL.
 */
export async function openPaddleCheckout(
  options: OpenPaddleCheckoutOptions
): Promise<OpenPaddleCheckoutResult> {
  const { planId, cycle, userId, userEmail, theme = "dark" } = options;

  // 1. Fetch dynamic config to ensure Price IDs and token are up to date
  const dynamicConfig = await fetchBillingConfig();
  const paddle = await getPaddleClient();
  const initStatus = getPaddleInitStatus();

  let priceId = getPaddlePriceId(planId, cycle);
  if (
    (!priceId || priceId.startsWith("pri_pro_") || priceId.startsWith("pri_biz_") || priceId.startsWith("pri_ent_")) &&
    dynamicConfig?.priceIds
  ) {
    const planPrices = dynamicConfig.priceIds[planId];
    if (planPrices) {
      priceId = cycle === "YEARLY" ? planPrices.yearly : planPrices.monthly;
    }
  }

  let discountId: string | undefined = undefined;
  if (cycle === "MONTHLY") {
    if (planId === "PRO") discountId = process.env.NEXT_PUBLIC_PADDLE_DISCOUNT_PRO_MONTHLY;
    else if (planId === "BUSINESS") discountId = process.env.NEXT_PUBLIC_PADDLE_DISCOUNT_BUSINESS_MONTHLY;
    else if (planId === "ENTERPRISE") discountId = process.env.NEXT_PUBLIC_PADDLE_DISCOUNT_ENTERPRISE_MONTHLY;

    if (!discountId && dynamicConfig?.discountIds) {
      discountId = dynamicConfig.discountIds[planId]?.monthly;
    }
  }

  console.info("[Paddle Checkout] Starting checkout for:", {
    planId,
    cycle,
    priceId,
    discountId,
    hasPaddle: !!paddle,
    initStatus,
  });

  // If Paddle.js script was explicitly blocked by browser extension / ad-blocker
  if (!paddle && initStatus.isBlocked) {
    return {
      success: false,
      isAdBlocked: true,
      error:
        "Le script de paiement Paddle (cdn.paddle.com) est bloqué par votre navigateur (AdBlock, Brave Shields ou uBlock). Veuillez désactiver le bloqueur pour continuer.",
    };
  }

  // 2. Try creating server-side transaction first (Recommended Paddle pattern)
  try {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId,
        cycle,
        userId,
        discountId,
        customerEmail: userEmail,
        successUrl: `${window.location.origin}/dashboard/settings?tab=billing&checkout_success=true&plan=${planId}`,
        cancelUrl: `${window.location.origin}/dashboard/pricing`,
      }),
    });

    const data = await res.json();

    if (data.success) {
      // If Paddle transaction was created and we have Paddle.js on client, open with transactionId
      if (paddle && data.transactionId && !data.transactionId.startsWith("txn_paddle_dev_")) {
        try {
          paddle.Checkout.open({
            transactionId: data.transactionId,
            settings: {
              displayMode: "overlay",
              theme: theme === "light" ? "light" : "dark",
              variant: "one-page",
              successUrl: `${window.location.origin}/dashboard/settings?tab=billing&checkout_success=true&plan=${planId}&ptxn=${data.transactionId}`,
            },
          });
          return { success: true };
        } catch (overlayErr: any) {
          console.warn("[Paddle.js] Failed to open with transactionId, trying direct URL:", overlayErr);
        }
      }

      // If Paddle returned a checkout URL
      if (data.checkoutUrl && data.checkoutUrl.startsWith("http") && !data.checkoutUrl.includes("checkout_success=true")) {
        let targetUrl = data.checkoutUrl;
        if (typeof window !== "undefined" && window.location.protocol === "http:" && targetUrl.startsWith("https://localhost")) {
          targetUrl = targetUrl.replace("https://localhost", "http://localhost");
        }
        window.location.href = targetUrl;
        return { success: true };
      }

      return { success: true };
    } else if (data.error && data.error.includes("transaction_default_checkout_url_not_set")) {
      return {
        success: false,
        error:
          "Configuration Paddle requise : veuillez vous rendre sur https://sandbox-vendors.paddle.com/checkout-settings et définir l'URL par défaut (ex: http://localhost:3000) dans la section 'Default payment link'.",
      };
    } else if (data.error) {
      return {
        success: false,
        error: data.error,
      };
    }
  } catch (apiErr: any) {
    console.error("[Paddle Checkout API Error]:", apiErr);
    return {
      success: false,
      error: `Erreur de communication avec le serveur : ${apiErr?.message || "Échec réseau"}`,
    };
  }

  // 3. Fallback: Try client-side direct item opening
  if (paddle && priceId && !priceId.includes("pri_pro_monthly")) {
    try {
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        discountId,
        customData: {
          userId: userId || "",
          planId,
          cycle,
        },
        customer: userEmail ? { email: userEmail } : undefined,
        settings: {
          displayMode: "overlay",
          theme: theme === "light" ? "light" : "dark",
          variant: "one-page",
          successUrl: `${window.location.origin}/dashboard/settings?tab=billing&checkout_success=true&plan=${planId}`,
        },
      });
      return { success: true };
    } catch (err: any) {
      console.error("[Paddle.js] Direct open error:", err);
      return {
        success: false,
        error: err?.message || "Impossible d'ouvrir le checkout Paddle.",
      };
    }
  }

  return {
    success: false,
    error: initStatus.isBlocked
      ? "Le script Paddle est bloqué par votre navigateur (bloqueur de publicité détecté)."
      : "Le service de paiement Paddle n'a pas pu être initialisé. Veuillez rafraîchir la page.",
    isAdBlocked: initStatus.isBlocked,
  };
}
