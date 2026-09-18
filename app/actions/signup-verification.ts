"use server";

import bcrypt from "bcryptjs";
import { sendSignupVerificationPinEmail } from "@/lib/resend";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://beloved-avocet-415.convex.cloud";
const convex = new ConvexHttpClient(convexUrl);

/**
 * 1. Request a 6-digit PIN code to verify and activate a new account via Resend
 */
export async function sendSignupPinAction({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; message: string; isDevFallback?: boolean; email?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail) {
      return { success: false, message: "Email address is required." };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, message: "Invalid email address format." };
    }
    if (!password || password.length < 8) {
      return {
        success: false,
        message: "Password must be at least 8 characters long.",
      };
    }

    // Check if account already exists in Convex
    const existingUser = await convex.query(api.users.getUserByEmail, {
      email: cleanEmail,
    });

    if (existingUser) {
      return {
        success: false,
        message: "An account already exists with this email address. Please sign in.",
      };
    }

    // Securely hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate random secure 6-digit numeric PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Convex with 15-min expiration
    await convex.mutation(api.users.createSignupVerificationToken, {
      name: cleanName || cleanEmail.split("@")[0],
      email: cleanEmail,
      passwordHash,
      pin,
    });

    // Send email via Resend
    const emailResult = await sendSignupVerificationPinEmail({
      to: cleanEmail,
      pin,
      name: cleanName,
    });

    if (!emailResult.success) {
      console.error("[SignupVerification] Email delivery failed:", emailResult.error);
      return {
        success: false,
        message: "Failed to send confirmation email. Please verify your email address or try again.",
      };
    }

    return {
      success: true,
      message: "A 6-digit verification PIN has been sent to your email!",
      email: cleanEmail,
    };
  } catch (err: any) {
    console.error("[sendSignupPinAction] Error:", err);
    if (err?.message?.includes("EMAIL_ALREADY_EXISTS")) {
      return {
        success: false,
        message: "This email address is already registered. Please log in.",
      };
    }
    return {
      success: false,
      message: err?.message || "Error generating verification PIN code.",
    };
  }
}

/**
 * 2. Verify 6-digit PIN code validity
 */
export async function verifySignupPinAction({
  email,
  pin,
}: {
  email: string;
  pin: string;
}): Promise<{ success: boolean; valid: boolean; message?: string; name?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pin.trim();

    if (!cleanEmail || !cleanPin || cleanPin.length !== 6) {
      return { success: false, valid: false, message: "Invalid PIN code (6 digits required)." };
    }

    const result = await convex.query(api.users.verifySignupVerificationToken, {
      email: cleanEmail,
      pin: cleanPin,
    });

    if (!result.valid) {
      let message = "Invalid PIN code.";
      if (result.reason === "PIN_EXPIRED") {
        message = "This PIN code has expired (15 min validity). Please request a new one.";
      } else if (result.reason === "PIN_ALREADY_USED") {
        message = "This PIN code has already been used.";
      }
      return { success: true, valid: false, message };
    }

    return { success: true, valid: true, name: result.name };
  } catch (err: any) {
    console.error("[verifySignupPinAction] Error:", err);
    return { success: false, valid: false, message: "Error verifying PIN code." };
  }
}

/**
 * 3. Complete account creation with verified PIN and sync to Cloudflare
 */
export async function completeSignupWithPinAction({
  email,
  pin,
}: {
  email: string;
  pin: string;
}): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pin.trim();

    const result = await convex.mutation(api.users.completeSignupWithVerificationPin, {
      email: cleanEmail,
      pin: cleanPin,
    });

    if (!result?.success || !result.userId) {
      return { success: false, message: "Could not finalize registration." };
    }

    // Sync user with Cloudflare backend D1 database
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_API_URL ||
        "https://lshorter-api.fiatechnologiecam.workers.dev";
      const secret = process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

      await fetch(`${backendUrl}/api/v1/users/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Frontend-Secret": secret,
        },
        body: JSON.stringify({
          id: result.userId,
          name: result.name,
          email: cleanEmail,
          provider: "credentials",
        }),
      });
    } catch (syncErr) {
      console.error("Cloudflare user sync error (ignoring):", syncErr);
    }

    return {
      success: true,
      message: "Account created and activated successfully!",
      userId: result.userId,
    };
  } catch (err: any) {
    console.error("[completeSignupWithPinAction] Error:", err);
    if (err?.message?.includes("INVALID_OR_EXPIRED_PIN")) {
      return { success: false, message: "Invalid or expired PIN code." };
    }
    if (err?.message?.includes("EMAIL_ALREADY_EXISTS")) {
      return { success: false, message: "This account is already created. Please log in." };
    }
    return { success: false, message: err?.message || "Error activating account." };
  }
}
