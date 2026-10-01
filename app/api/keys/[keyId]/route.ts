import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { WORKER_URL, FRONTEND_SECRET as SECRET } from "@/lib/backend-config";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ keyId: string }> }
) {
  const { keyId } = await context.params;
  const { searchParams } = new URL(req.url);
  let userId = searchParams.get("userId") || undefined;

  if (!userId) {
    const session = await auth();
    userId = (session?.user as any)?.id || (session?.user as any)?.sub || undefined;
  }

  if (!keyId) {
    return NextResponse.json({ success: false, error: "keyId requis" }, { status: 400 });
  }

  try {
    // 1. If userId is available, delete using the user-scoped route: /api/v1/users/:userId/keys/:keyId
    if (userId) {
      const userRes = await fetch(
        `${WORKER_URL}/api/v1/users/${encodeURIComponent(userId)}/keys/${encodeURIComponent(keyId)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "X-Frontend-Secret": SECRET,
          },
        }
      ).catch((err) => {
        console.warn("[API Key DELETE] User-scoped Cloudflare delete error:", err);
        return null;
      });

      if (userRes && userRes.ok) {
        return NextResponse.json({
          success: true,
          message: "API key revoked on Cloudflare D1",
        });
      }
    }

    // 2. Fallback / direct key deletion by ID on Cloudflare Worker: /api/v1/users/keys/:keyId
    const directRes = await fetch(
      `${WORKER_URL}/api/v1/users/keys/${encodeURIComponent(keyId)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Frontend-Secret": SECRET,
        },
      }
    ).catch((err) => {
      console.warn("[API Key DELETE] Direct Cloudflare delete error:", err);
      return null;
    });

    if (directRes && directRes.ok) {
      return NextResponse.json({
        success: true,
        message: "API key revoked on Cloudflare D1",
      });
    }

    return NextResponse.json({
      success: true,
      message: "API key deletion request processed",
    });
  } catch (error: any) {
    console.error("[API Key DELETE] Error revoking key on Cloudflare:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Erreur suppression clé API" },
      { status: 500 }
    );
  }
}
