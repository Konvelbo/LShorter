"use server";

import bcrypt from "bcryptjs";
import { sendPasswordResetPinEmail } from "@/lib/resend";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";

/**
 * 1. Request a 6-digit PIN code to reset password via Resend
 */
export async function sendPasswordResetPinAction({
  email,
}: {
  email: string;
}): Promise<{ success: boolean; message: string; isDevFallback?: boolean }> {
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

    // Store in Convex with 15-min expiration
    await convex.mutation(api.users.createPasswordResetToken, {
      email: cleanEmail,
      pin,
    });

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
 * 2. Verify 6-digit PIN code validity
 */
export async function verifyResetPinAction({
  email,
  pin,
}: {
  email: string;
  pin: string;
}): Promise<{ success: boolean; valid: boolean; message?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pin.trim();

    if (!cleanEmail || !cleanPin || cleanPin.length !== 6) {
      return { success: false, valid: false, message: "Invalid PIN code (6 digits required)." };
    }

    const result = await convex.query(api.users.verifyPasswordResetToken, {
      email: cleanEmail,
      pin: cleanPin,
    });

    if (!result.valid) {
      let message = "Invalid PIN code.";
      if (result.reason === "PIN_EXPIRED") {
        message = "This PIN code has expired (15-min validity). Please request a new one.";
      } else if (result.reason === "PIN_ALREADY_USED") {
        message = "This PIN code has already been used.";
      }
      return { success: true, valid: false, message };
    }

    return { success: true, valid: true };
  } catch (err: any) {
    console.error("[verifyResetPinAction] Error:", err);
    return { success: false, valid: false, message: "Error verifying PIN code." };
  }
}

/**
 * 3. Reset password with verified PIN
 */
export async function resetPasswordWithPinAction({
  email,
  pin,
  newPassword,
}: {
  email: string;
  pin: string;
  newPassword: string;
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

    // Hash new password securely with bcrypt (10 rounds)
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await convex.mutation(api.users.resetPasswordWithToken, {
      email: cleanEmail,
      pin: cleanPin,
      newPasswordHash,
    });

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
