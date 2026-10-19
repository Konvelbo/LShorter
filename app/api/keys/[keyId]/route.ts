import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { WORKER_URL, FRONTEND_SECRET as SECRET } from "@/lib/backend-config";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { deleteD1ApiKey } from "@/lib/d1-client";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ keyId: string }> }
) {
  const reqUrl = new URL(req.url);
  const session = await auth().catch(() => null);

  const authHeader = req.headers.get("authorization") || "";
  const frontendSecret = req.headers.get("x-frontend-secret") || "";
  const isInternal = frontendSecret === SECRET || authHeader === `Bearer ${SECRET}`;

  if (!session?.user && !isInternal) {
    return NextResponse.json(
      { success: false, error: "Authentication required to revoke API keys." },
      { status: 401 }
    );
  }

  const sessionUserId = (session?.user as any)?.id || (session?.user as any)?.sub || "";
  const sessionEmail = session?.user?.email || "";

  let userId = isInternal
    ? (reqUrl.searchParams.get("userId") || sessionUserId)
    : (sessionUserId || reqUrl.searchParams.get("userId") || "");
  let userEmail = isInternal
    ? (reqUrl.searchParams.get("userEmail") || sessionEmail)
    : (sessionEmail || reqUrl.searchParams.get("userEmail") || "");

  if ((!userId || userId === "usr_anonymous" || userId.includes("@")) && userEmail) {
    try {
      const cu = await convex.query(api.users.getUserByEmail, {
        email: userEmail.toLowerCase().trim(),
      });
      if (cu?.userId) {
        userId = cu.userId;
      }
    } catch (e) {
      console.warn("[app/api/keys/[keyId] DELETE] Convex lookup warning:", e);
    }
  }

  const effectiveId = userId || userEmail;
  if (!effectiveId) {
    return NextResponse.json(
      { success: false, error: "Authentication required to revoke API keys." },
      { status: 401 }
    );
  }

  const { keyId } = await context.params;
  if (!keyId) {
    return NextResponse.json({ success: false, error: "keyId requis" }, { status: 400 });
  }

  try {
    // 1. Attempt worker deletion
    try {
      await fetch(
        `${WORKER_URL}/api/v1/users/${encodeURIComponent(effectiveId)}/keys/${encodeURIComponent(keyId)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "X-Frontend-Secret": SECRET,
          },
        }
      );
    } catch {}

    // 2. Direct D1 deletion to guarantee revocation even if worker route failed or key was under email
    await deleteD1ApiKey(keyId, effectiveId);

    return NextResponse.json({
      success: true,
      message: "API key revoked on Cloudflare D1",
    });
  } catch (error: any) {
    console.error("[API Key DELETE] Error revoking key on Cloudflare:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Erreur suppression clé API" },
      { status: 500 }
    );
  }
}
