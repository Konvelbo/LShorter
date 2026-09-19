"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { sendSignupVerificationPinEmail } from "@/lib/resend";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import {
  createStatelessPinToken,
  verifyStatelessPinToken,
} from "@/lib/stateless-pin";

const SIGNUP_COOKIE_NAME = "lsh_signup_token";

/**
 * 1. Request a 6-digit PIN code to verify and activate a new account via Resend (Stateless Option A)
 */
export async function sendSignupPinAction({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}): Promise<{
  success: boolean;
  message: string;
  isDevFallback?: boolean;
  email?: string;
  token?: string;
}> {
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

    // Create stateless signed HMAC token (15-min TTL)
    const token = createStatelessPinToken(
      {
        email: cleanEmail,
        name: cleanName || cleanEmail.split("@")[0],
        passwordHash,
        pin,
        type: "signup",
      },
      15
    );

    // Store token in HTTP-only secure cookie
    try {
      const cookieStore = await cookies();
      cookieStore.set(SIGNUP_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60,
        path: "/",
      });
    } catch (cookieErr) {
      console.warn("[SignupVerification] Non-fatal cookie set warning:", cookieErr);
    }

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
      token,
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
 * 2. Verify 6-digit PIN code validity (Stateless Option A)
 */
export async function verifySignupPinAction({
  email,
  pin,
  token: clientToken,
}: {
  email: string;
  pin: string;
  token?: string;
}): Promise<{ success: boolean; valid: boolean; message?: string; name?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pin.trim();

    if (!cleanEmail || !cleanPin || cleanPin.length !== 6) {
      return { success: false, valid: false, message: "Invalid PIN code (6 digits required)." };
    }

    let token = clientToken;
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get(SIGNUP_COOKIE_NAME)?.value;
      } catch {}
    }

    if (!token) {
      return {
        success: true,
        valid: false,
        message: "Verification session expired (15 min validity). Please request a new PIN code.",
      };
    }

    const result = verifyStatelessPinToken(token, cleanPin);

    if (!result.valid || !result.payload) {
      let message = "Invalid PIN code.";
      if (result.reason === "TOKEN_EXPIRED") {
        message = "This PIN code has expired (15 min validity). Please request a new one.";
      }
      return { success: true, valid: false, message };
    }

    if (result.payload.email !== cleanEmail || result.payload.type !== "signup") {
      return { success: true, valid: false, message: "Email mismatch for this PIN session." };
    }

    return { success: true, valid: true, name: result.payload.name };
  } catch (err: any) {
    console.error("[verifySignupPinAction] Error:", err);
    return { success: false, valid: false, message: "Error verifying PIN code." };
  }
}

/**
 * 3. Complete account creation with verified PIN and sync to Cloudflare (Stateless Option A)
 */
export async function completeSignupWithPinAction({
  email,
  pin,
  token: clientToken,
}: {
  email: string;
  pin: string;
  token?: string;
}): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pin.trim();

    let token = clientToken;
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get(SIGNUP_COOKIE_NAME)?.value;
      } catch {}
    }

    if (!token) {
      return {
        success: false,
        message: "Verification session expired. Please request a new PIN code.",
      };
    }

    const result = verifyStatelessPinToken(token, cleanPin);

    if (!result.valid || !result.payload) {
      let message = "Invalid PIN code.";
      if (result.reason === "TOKEN_EXPIRED") {
        message = "This PIN code has expired. Please request a new one.";
      }
      return { success: false, message };
    }

    if (result.payload.email !== cleanEmail || result.payload.type !== "signup") {
      return { success: false, message: "Session email mismatch. Please try again." };
    }

    if (!result.payload.passwordHash) {
      return { success: false, message: "Registration session corrupted. Please sign up again." };
    }

    // Directly insert the user into Convex users table
    const createdUser = await convex.mutation(api.users.createUserWithVerifiedEmail, {
      name: result.payload.name || cleanEmail.split("@")[0],
      email: cleanEmail,
      passwordHash: result.payload.passwordHash,
    });

    if (!createdUser?.success || !createdUser.userId) {
      return { success: false, message: "Could not finalize registration." };
    }

    // Clear verification cookie
    try {
      const cookieStore = await cookies();
      cookieStore.delete(SIGNUP_COOKIE_NAME);
    } catch {}

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
          id: createdUser.userId,
          name: createdUser.name,
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
      userId: createdUser.userId,
    };
  } catch (err: any) {
    console.error("[completeSignupWithPinAction] Error:", err);
    if (err?.message?.includes("EMAIL_ALREADY_EXISTS")) {
      return { success: false, message: "This account is already created. Please log in." };
    }
    return { success: false, message: err?.message || "Error activating account." };
  }
}
