"use server";

import { fetchWorkerLink } from "@/lib/redirect-engine";
import { checkRateLimit } from "@/lib/security-utils";

/**
 * Server-authoritative verification of the developer bypass password for PathLock links.
 * Never exposes the plaintext password to client-side components or RSC payloads.
 */
export async function verifyPathLockUnlockPassword(
  slug: string,
  candidatePassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!slug || !candidatePassword) {
      return { success: false, error: "Mot de passe requis." };
    }

    const rateLimitKey = `pathlock_unlock_${slug.toLowerCase()}`;
    const rateCheck = checkRateLimit(rateLimitKey, 10, 60000);
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Trop de tentatives. Veuillez réessayer dans ${rateCheck.retryAfterSec}s.`,
      };
    }

    const link = await fetchWorkerLink(slug);
    if (!link) {
      return { success: false, error: "Lien introuvable." };
    }

    const expected =
      link.path_lock_password || (link as any).pathLockPassword || "";
    if (!expected) {
      return { success: false, error: "Aucun mot de passe configuré pour ce lien." };
    }

    if (candidatePassword.trim() === String(expected).trim()) {
      return { success: true };
    }

    return { success: false, error: "Mot de passe incorrect." };
  } catch {
    return { success: false, error: "Erreur de vérification du mot de passe." };
  }
}
