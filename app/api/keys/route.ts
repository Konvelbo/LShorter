import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { WORKER_URL, FRONTEND_SECRET as SECRET } from "@/lib/backend-config";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let userId = searchParams.get("userId") || "";

  if (!userId) {
    const session = await auth();
    userId = (session?.user as any)?.id || (session?.user as any)?.sub || "";
  }

  if (!userId) {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
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
    );

    if (!cfRes.ok) {
      const errText = await cfRes.text().catch(() => "");
      console.warn("[API Keys GET] Cloudflare error:", cfRes.status, errText);
      return NextResponse.json({ success: true, data: [] });
    }

    const cfJson = await cfRes.json().catch(() => null);
    const cfList = Array.isArray(cfJson?.data)
      ? cfJson.data
      : Array.isArray(cfJson)
      ? cfJson
      : [];

    return NextResponse.json({ success: true, data: cfList });
  } catch (error) {
    console.error("[API Keys GET] Error retrieving keys from Cloudflare:", error);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const queryUserId = searchParams.get("userId") || "";

  try {
    const body = await req.json().catch(() => ({}));
    let userId = body.userId || queryUserId;

    if (!userId) {
      const session = await auth();
      userId = (session?.user as any)?.id || (session?.user as any)?.sub || "";
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Identifiant utilisateur requis (userId)" },
        { status: 400 }
      );
    }

    const keyName = (body.name || "Clé API").trim();
    const keyScope = body.scope || "read_write";

    // Create the API Key directly on Cloudflare Worker D1 (`api_keys` table)
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

    if (!cfRes.ok) {
      const errJson = await cfRes.json().catch(() => null);
      const errMsg =
        errJson?.error || errJson?.message || "Erreur création clé API sur Cloudflare";
      return NextResponse.json(
        { success: false, error: errMsg },
        { status: cfRes.status }
      );
    }

    const cfJson = await cfRes.json().catch(() => null);
    const cfData = cfJson?.data || cfJson;

    return NextResponse.json(
      {
        success: true,
        data: cfData,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API Keys POST] Error generating key on Cloudflare:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Erreur création clé API" },
      { status: 500 }
    );
  }
}
