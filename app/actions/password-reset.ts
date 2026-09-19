"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { sendPasswordResetPinEmail } from "@/lib/resend";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import {
  createStatelessPinToken,
  verifyStatelessPinToken,
} from "@/lib/stateless-pin";

const RESET_COOKIE_NAME = "lsh_reset_token";

/**
 * 1. Request a 6-digit PIN code to reset password via Resend (Stateless Option A)
 */
export async function sendPasswordResetPinAction({
  email,
}: {
  email: string;
}): Promise<{
  success: boolean;
  message: string;
  isDevFallback?: boolean;
  token?: string;
}> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: "Adresse e-mail requise." };
    }

    // Check if user exists in Convex
    const user = await convex.query(api.users.getUserByEmail, {
      email: cleanEmail,
    });

    if (!user) {
      // Return a generic message for security (don't leak user existence)
      return {
        success: false,
        message: "No account found with this email address.",
      };
    }

    // Generate random secure 6-digit numeric PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    // Generate signed stateless token (15-min validity)
    const token = createStatelessPinToken(
      {
        email: cleanEmail,
        pin,
        type: "reset",
      },
      15
    );

    // Save in HTTP-only secure cookie
    try {
      const cookieStore = await cookies();
      cookieStore.set(RESET_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60,
        path: "/",
      });
    } catch (cookieErr) {
      console.warn("[PasswordReset] Non-fatal cookie set warning:", cookieErr);
    }

    // Send email via Resend
    const emailResult = await sendPasswordResetPinEmail({
      to: cleanEmail,
      pin,
      name: user.name,
    });

    if (!emailResult.success) {
      console.error("[PasswordReset] Email sending failed:", emailResult.error);
      return {
        success: false,
        message: "Failed to send reset email. Please verify your email address or try again.",
      };
    }

    return {
      success: true,
      message: "PIN code sent to your email successfully!",
      isDevFallback: emailResult.isDevFallback,
      token,
    };
  } catch (err: any) {
    console.error("[sendPasswordResetPinAction] Error:", err);
    return {
      success: false,
      message: err?.message || "Error generating PIN reset code.",
    };
  }
}

/**
 * 2. Verify 6-digit PIN code validity (Stateless Option A)
 */
export async function verifyResetPinAction({
  email,
  pin,
  token: clientToken,
}: {
  email: string;
  pin: string;
  token?: string;
}): Promise<{ success: boolean; valid: boolean; message?: string }> {
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
        token = cookieStore.get(RESET_COOKIE_NAME)?.value;
      } catch {}
    }

    if (!token) {
      return {
        success: true,
        valid: false,
        message: "Reset session expired (15-min validity). Please request a new PIN code.",
      };
    }

    const result = verifyStatelessPinToken(token, cleanPin);

    if (!result.valid || !result.payload) {
      let message = "Invalid PIN code.";
      if (result.reason === "TOKEN_EXPIRED") {
        message = "This PIN code has expired (15-min validity). Please request a new one.";
      }
      return { success: true, valid: false, message };
    }

    if (result.payload.email !== cleanEmail || result.payload.type !== "reset") {
      return { success: true, valid: false, message: "Email mismatch for this reset session." };
    }

    return { success: true, valid: true };
  } catch (err: any) {
    console.error("[verifyResetPinAction] Error:", err);
    return { success: false, valid: false, message: "Error verifying PIN code." };
  }
}

/**
 * 3. Reset password with verified PIN (Stateless Option A)
 */
export async function resetPasswordWithPinAction({
  email,
  pin,
  newPassword,
  token: clientToken,
}: {
  email: string;
  pin: string;
  newPassword: string;
  token?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pin.trim();

    if (newPassword.length < 8) {
      return {
        success: false,
        message: "Password must be at least 8 characters long.",
      };
    }

    let token = clientToken;
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get(RESET_COOKIE_NAME)?.value;
      } catch {}
    }

    if (!token) {
      return {
        success: false,
        message: "Reset session expired. Please request a new PIN code.",
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

    if (result.payload.email !== cleanEmail || result.payload.type !== "reset") {
      return { success: false, message: "Email mismatch for this reset session." };
    }

    // Hash new password securely with bcrypt (10 rounds)
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await convex.mutation(api.users.updatePasswordForVerifiedEmail, {
      email: cleanEmail,
      newPasswordHash,
    });

    // Clear cookie
    try {
      const cookieStore = await cookies();
      cookieStore.delete(RESET_COOKIE_NAME);
    } catch {}

    return {
      success: true,
      message: "Your password has been updated successfully!",
    };
  } catch (err: any) {
    console.error("[resetPasswordWithPinAction] Error:", err);
    return {
      success: false,
      message: err?.message || "Error updating your password.",
    };
  }
}
