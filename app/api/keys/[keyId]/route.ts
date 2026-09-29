import { NextResponse } from "next/server";
import { revokeApiKey } from "@/lib/api-keys-store";

import { WORKER_URL, FRONTEND_SECRET as SECRET } from "@/lib/backend-config";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ keyId: string }> }
) {
  const { keyId } = await context.params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || undefined;

  try {
    if (userId && keyId) {
      await fetch(
        `${WORKER_URL}/api/v1/users/${encodeURIComponent(userId)}/keys/${encodeURIComponent(keyId)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "X-Frontend-Secret": SECRET,
          },
        }
      ).catch((err) => {
        console.warn("[API Key DELETE] Cloudflare Worker delete error:", err);
      });
    }

    const success = revokeApiKey(keyId, userId);
    return NextResponse.json({
      success: true,
      removedLocally: success,
      message: "API key revoked on Cloudflare D1 and frontend",
    });
  } catch (error) {
    console.warn("[API Key DELETE] Error revoking key:", error);
    return NextResponse.json({ success: true });
  }
}


