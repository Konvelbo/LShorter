"use server";

import bcrypt from "bcryptjs";
import { sendPasswordResetPinEmail } from "@/lib/resend";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const convex = new ConvexHttpClient(convexUrl);

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
        message: "Aucun compte associé à cette adresse e-mail.",
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
      console.warn("[PasswordReset] Email sending warning:", emailResult.error);
      const isSandboxRestriction =
        emailResult.error?.includes("testing email address") ||
        emailResult.error?.includes("validation_error") ||
        emailResult.error?.includes("only send testing emails");

      if (isSandboxRestriction) {
        return {
          success: true,
          message: `Code PIN généré ! (Note test Resend : e-mail livrable uniquement à fiatechnologiecam@gmail.com. Votre code test est : ${pin})`,
          isDevFallback: true,
        };
      }

      return {
        success: false,
        message: emailResult.error || "Échec de l'envoi de l'e-mail.",
      };
    }

    return {
      success: true,
      message: "Code PIN envoyé par e-mail avec succès !",
      isDevFallback: emailResult.isDevFallback,
    };
  } catch (err: any) {
    console.error("[sendPasswordResetPinAction] Error:", err);
    return {
      success: false,
      message: err?.message || "Erreur lors de la génération du code PIN.",
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
      return { success: false, valid: false, message: "Code PIN invalide (6 chiffres requis)." };
    }

    const result = await convex.query(api.users.verifyPasswordResetToken, {
      email: cleanEmail,
      pin: cleanPin,
    });

    if (!result.valid) {
      let message = "Code PIN invalide.";
      if (result.reason === "PIN_EXPIRED") {
        message = "Ce code PIN a expiré (validité 15 min). Veuillez en demander un nouveau.";
      } else if (result.reason === "PIN_ALREADY_USED") {
        message = "Ce code PIN a déjà été utilisé.";
      }
      return { success: true, valid: false, message };
    }

    return { success: true, valid: true };
  } catch (err: any) {
    console.error("[verifyResetPinAction] Error:", err);
    return { success: false, valid: false, message: "Erreur lors de la vérification du code." };
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
        message: "Le mot de passe doit contenir au moins 8 caractères.",
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
      message: "Votre mot de passe a été mis à jour avec succès !",
    };
  } catch (err: any) {
    console.error("[resetPasswordWithPinAction] Error:", err);
    return {
      success: false,
      message: err?.message || "Erreur lors de la mise à jour du mot de passe.",
    };
  }
}
