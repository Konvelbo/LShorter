"use server";

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { sendPlanPurchaseEmail } from "@/lib/resend";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://beloved-avocet-415.convex.cloud";
const convex = new ConvexHttpClient(convexUrl);

function formatDateFr(date: Date): string {
  const months = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Server action triggered after a plan upgrade / subscription purchase.
 * Computes the exact activation and expiration dates, and sends the thank-you confirmation email.
 */
export async function sendPlanPurchaseConfirmationAction({
  userId,
  userEmail,
  userName,
  plan,
  cycle = "MONTHLY",
}: {
  userId: string;
  userEmail?: string;
  userName?: string;
  plan: string;
  cycle?: "MONTHLY" | "YEARLY" | string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const cleanPlan = plan.toUpperCase();
    // Only send thank-you & confirmation emails for paid plans
    if (cleanPlan === "FREE" || cleanPlan === "FREEMIUM") {
      return { success: true };
    }

    let email = userEmail?.trim().toLowerCase();
    let name = userName?.trim();

    // If email or name is missing, query Convex
    if (!email && userId) {
      const user = await convex.query(api.users.getCurrentUser, { userId });
      if (user) {
        email = user.email;
        name = user.name || name;
      }
    }

    if (!email) {
      console.warn("[sendPlanPurchaseConfirmationAction] Missing email address for user:", userId);
      return { success: false, message: "User email not found." };
    }

    const now = new Date();
    const startDate = formatDateFr(now);

    const isYearly = cycle.toUpperCase() === "YEARLY";
    const expirationDate = new Date(now);
    if (isYearly) {
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    } else {
      expirationDate.setDate(expirationDate.getDate() + 30);
    }
    const endDate = formatDateFr(expirationDate);

    const emailResult = await sendPlanPurchaseEmail({
      to: email,
      name: name || email.split("@")[0],
      planName: cleanPlan,
      startDate,
      endDate,
      cycle: isYearly ? "Annuel (365 jours)" : "Mensuel (30 jours)",
    });

    if (!emailResult.success) {
      console.error("[sendPlanPurchaseConfirmationAction] Error sending email:", emailResult.error);
      return { success: false, message: emailResult.error };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[sendPlanPurchaseConfirmationAction] Unexpected error:", error);
    return { success: false, message: error?.message || "Internal error" };
  }
}
