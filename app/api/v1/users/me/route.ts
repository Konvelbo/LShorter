import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateApiKey } from "@/lib/api-keys-store";
import { UserMeResponse } from "@/types";
import { getPlanDefinition, evaluateClickQuotaAndOverage } from "@/src/config/pricing";

import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

function enrichWithPricingAndOverage(data: UserMeResponse["data"]): UserMeResponse["data"] {
  const planDef = getPlanDefinition(data.plan);
  const quotaEval = evaluateClickQuotaAndOverage(data.plan, data.clicksThisMonth || 0);
  return {
    ...data,
    planLimits: {
      monthlyClicks: planDef.limits.monthlyClicks,
      activeLinks: planDef.limits.activeLinks,
      customDomains: planDef.limits.customDomains,
      retargetingPixels: planDef.limits.retargetingPixels,
      apiRateLimitPerMinute: planDef.limits.apiRateLimitPerMinute,
    },
    overage: quotaEval.overage,
  };
}

/**
 * GET /api/v1/users/me
 * Headers requis : Authorization: Bearer <api_key> (ou X-Frontend-Secret, ou Session Cookie)
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const frontendSecret = req.headers.get("x-frontend-secret") || "";
    const xUserId = req.headers.get("x-user-id") || "";
    const xUserEmail = req.headers.get("x-user-email") || "";

    let authenticatedUserId: string | null = null;
    let authenticatedEmail: string | null = null;
    let authenticatedName: string | null = null;
    let authenticatedAvatar: string | null = null;
    let authenticatedPlan: string = "FREE";

    // 1. Security: Block public API keys (lsh_*, qlk_*) from reading or mutating user profile via /users/me
    if (authHeader.startsWith("Bearer ")) {
      const rawKey = authHeader.slice(7).trim();
      if (rawKey === FRONTEND_SECRET) {
        authenticatedUserId = xUserId || "usr_admin";
        authenticatedEmail = xUserEmail || null;
      } else {
        return NextResponse.json(
          {
            success: false,
            error:
              "Forbidden: User profile endpoints (/api/v1/users/me) are restricted to dashboard sessions only and cannot be accessed with public API keys.",
            code: "API_KEY_PROFILE_ACCESS_FORBIDDEN",
          },
          { status: 403 }
        );
      }
    } else if (frontendSecret === FRONTEND_SECRET) {
      authenticatedUserId = xUserId || "usr_admin";
      authenticatedEmail = xUserEmail || null;
    }

    // 2. Validation via Session NextAuth active
    if (!authenticatedUserId) {
      const session = await auth();
      if (session?.user) {
        authenticatedUserId = (session.user as any).id || (session.user as any).sub || session.user.email || null;
        authenticatedEmail = session.user.email || null;
        authenticatedName = session.user.name || null;
        authenticatedAvatar = session.user.image || null;
        authenticatedPlan = (session.user as any).plan || "FREE";
      }
    }

    if (!authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // 3. Appel au Cloudflare Edge Worker
    try {
      const workerHeaders: Record<string, string> = {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: authHeader || `Bearer ${FRONTEND_SECRET}`,
      };
      if (authenticatedUserId) workerHeaders["X-User-Id"] = authenticatedUserId;
      if (authenticatedEmail) workerHeaders["X-User-Email"] = authenticatedEmail;
      if (authenticatedPlan) workerHeaders["X-User-Plan"] = authenticatedPlan;

      const workerRes = await fetch(`${WORKER_URL}/api/v1/users/me`, {
        headers: workerHeaders,
        cache: "no-store",
      });

      if (workerRes.ok) {
        const workerData: UserMeResponse = await workerRes.json();
        if (workerData.success && workerData.data) {
          workerData.data = enrichWithPricingAndOverage(workerData.data);
          return NextResponse.json(workerData);
        }
      }
    } catch (workerErr) {
      console.warn("[Users /me] Worker unreachable, using standard payload:", workerErr);
    }

    // 4. Réponse standard conforme à la spécification (enrichie avec planLimits & overage)
    const fullName = authenticatedName || null;
    const email = authenticatedEmail || "";
    const id = authenticatedUserId;

    const responsePayload: UserMeResponse = {
      success: true,
      data: enrichWithPricingAndOverage({
        id,
        email,
        name: fullName,
        fullName: fullName,
        avatarUrl: authenticatedAvatar || null,
        plan: (authenticatedPlan as any) || "FREEMIUM",
        clicksThisMonth: 0,
        linksCount: 0,
        domainsCount: 0,
        createdAt: new Date().toISOString(),
      }),
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error: any) {
    console.error("[Users /me GET Error]:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération du profil utilisateur" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/users/me
 * Met à jour le nom complet (FullName) ou l'avatar
 */
export async function PATCH(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const frontendSecret = req.headers.get("x-frontend-secret") || "";
    if (
      authHeader.startsWith("Bearer ") &&
      authHeader.slice(7).trim() !== FRONTEND_SECRET &&
      frontendSecret !== FRONTEND_SECRET
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Forbidden: Profile modifications via public API keys are disabled for security.",
          code: "API_KEY_PROFILE_MUTATION_FORBIDDEN",
        },
        { status: 403 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const newName = body.fullName || body.name;
    const newAvatar = body.avatarUrl || body.avatar_url;

    // Relais vers le Cloudflare Edge Worker
    try {
      await fetch(`${WORKER_URL}/api/v1/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Frontend-Secret": FRONTEND_SECRET,
          Authorization: `Bearer ${FRONTEND_SECRET}`,
        },
        body: JSON.stringify({ fullName: newName, name: newName, avatarUrl: newAvatar }),
      });
    } catch {}

    const updatedFullName = newName || null;

    return NextResponse.json({
      success: true,
      data: {
        name: updatedFullName,
        fullName: updatedFullName,
        avatarUrl: newAvatar || null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}
