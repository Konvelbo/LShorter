import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://greedy-mastiff-107.convex.cloud"
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, passwordHash } = body;

    if (!email || (!password && !passwordHash) || !name) {
      return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: "Format d'adresse e-mail invalide." }, { status: 400 });
    }

    const bcrypt = await import("bcryptjs");
    let finalHash = passwordHash;

    if (password) {
      if (typeof password !== "string" || password.length < 8) {
        return NextResponse.json(
          { error: "Le mot de passe doit comporter au moins 8 caractères." },
          { status: 400 }
        );
      }
      finalHash = await bcrypt.hash(password, 10);
    } else if (passwordHash && !passwordHash.startsWith("$2")) {
      finalHash = await bcrypt.hash(passwordHash, 10);
    }

    const result = await convex.mutation(api.users.registerWithEmail, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: finalHash,
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
