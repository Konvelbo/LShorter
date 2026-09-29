import { NextResponse } from "next/server";
import {
  getApiKeysForUser,
  createApiKeyForUser,
  mergeCloudflareKeysForUser,
} from "@/lib/api-keys-store";

import { WORKER_URL, FRONTEND_SECRET as SECRET } from "@/lib/backend-config";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "";

  try {
    if (userId) {
      const cfRes = await fetch(
        `${WORKER_URL}/api/v1/users/${encodeURIComponent(userId)}/keys`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Frontend-Secret": SECRET,
          },
          cache: "no-store",
        }
      ).catch(() => null);

      if (cfRes && cfRes.ok) {
        const cfJson = await cfRes.json().catch(() => null);
        const cfList = Array.isArray(cfJson?.data)
          ? cfJson.data
          : Array.isArray(cfJson)
          ? cfJson
          : [];
        const merged = mergeCloudflareKeysForUser(userId, cfList);
        return NextResponse.json({ success: true, data: merged, cloudflareSynced: true });
      }
    }

    const keys = getApiKeysForUser(userId);
    return NextResponse.json({ success: true, data: keys });
  } catch (error) {
    console.warn("[API Keys GET] Error retrieving keys:", error);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const queryUserId = searchParams.get("userId") || "";

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || queryUserId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Identifiant utilisateur requis (userId)" },
        { status: 400 }
      );
    }

    const keyName = (body.name || "Clé API").trim();
    const keyScope = body.scope || "read_write";

    // 1. Create the API Key directly on Cloudflare Worker D1 (`api_keys` table)
    let cfId: string | undefined;
    let cfRawKey: string | undefined;
    let storedOnCloudflare = false;

    try {
      const cfRes = await fetch(
        `${WORKER_URL}/api/v1/users/${encodeURIComponent(userId)}/keys`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Frontend-Secret": SECRET,
          },
          body: JSON.stringify({
            name: keyName,
            scope: keyScope,
          }),
        }
      );

      if (cfRes.ok) {
        const cfJson = await cfRes.json().catch(() => null);
        const cfData = cfJson?.data || cfJson;
        if (cfData?.key || cfData?.raw_key) {
          cfId = cfData.id;
          cfRawKey = cfData.key || cfData.raw_key;
          storedOnCloudflare = true;
        }
      } else {
        const errText = await cfRes.text().catch(() => "");
        console.warn("[API Keys POST] Cloudflare Worker response:", cfRes.status, errText);
      }
    } catch (cfErr) {
      console.warn("[API Keys POST] Could not reach Cloudflare Worker:", cfErr);
    }

    // 2. Mirror the exact Cloudflare-generated key (id & rawKey) in local store so frontend can reveal/copy it
    const { key, rawKey } = createApiKeyForUser({
      id: cfId,
      rawKey: cfRawKey,
      userId,
      name: keyName,
      scope: keyScope,
      rateLimit: body.rateLimit || 600,
      userEmail: body.userEmail || body.email,
      userName: body.userName || body.fullName || body.userFullName,
      userFullName: body.userFullName || body.fullName || body.userName,
      email: body.email || body.userEmail,
      fullName: body.fullName || body.userFullName || body.userName,
    });

    return NextResponse.json(
      {
        success: true,
        storedOnCloudflare,
        data: {
          ...key,
          raw_key: rawKey,
          rawKey: rawKey,
          storedOnCloudflare,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API Keys POST] Error generating key:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Erreur création clé API" },
      { status: 500 }
    );
  }
}


