import { NextResponse } from "next/server";
import {
  getApiKeysForUser,
  createApiKeyForUser,
} from "@/lib/api-keys-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "";

  try {
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

    const { key, rawKey } = createApiKeyForUser({
      userId,
      name: body.name || "Clé API",
      scope: body.scope || "read_write",
      rateLimit: body.rateLimit || 600,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...key,
          raw_key: rawKey,
          rawKey: rawKey,
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


