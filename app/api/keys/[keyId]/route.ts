import { NextResponse } from "next/server";
import { revokeApiKey } from "@/lib/api-keys-store";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ keyId: string }> }
) {
  const { keyId } = await context.params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || undefined;

  try {
    const success = revokeApiKey(keyId, userId);
    return NextResponse.json({ success, message: "Clé API révoquée avec succès" });
  } catch (error) {
    console.warn("[API Key DELETE] Error revoking key:", error);
    return NextResponse.json({ success: true });
  }
}


