import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { WORKER_URL, FRONTEND_SECRET as SECRET } from "@/lib/backend-config";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ keyId: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.id || (session?.user as any)?.sub || "";

  if (!userId) {
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
    // Strictly user-scoped deletion: /api/v1/users/:userId/keys/:keyId
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
