import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://greedy-mastiff-107.convex.cloud"
);

export async function POST(req: NextRequest) {
  try {
    const { name, email, passwordHash } = await req.json();

    if (!email || !passwordHash || !name) {
      return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
    }

    const result = await convex.mutation(api.users.registerWithEmail, {
      name,
      email,
      passwordHash,
    });

    return NextResponse.json({ success: true, userId: result.userId }, { status: 201 });
  } catch (err: any) {
    const message = err?.message || "Erreur serveur.";
    if (message.includes("EMAIL_ALREADY_EXISTS")) {
      return NextResponse.json({ error: "EMAIL_ALREADY_EXISTS" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
