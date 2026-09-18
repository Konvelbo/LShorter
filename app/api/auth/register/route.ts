import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import bcrypt from "bcryptjs";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://beloved-avocet-415.convex.cloud"
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, passwordHash } = body;

    if (!email || (!password && !passwordHash) || !name) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: "Invalid email address format." }, { status: 400 });
    }

    let finalHash = passwordHash;
    if (password) {
      if (typeof password !== "string" || password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters long." },
          { status: 400 }
        );
      }
      finalHash = await bcrypt.hash(password, 10);
    } else if (passwordHash && !passwordHash.startsWith("$2")) {
      finalHash = await bcrypt.hash(passwordHash, 10);
    }

    const result = await convex.mutation(api.users.registerWithEmail, {
      name: name.trim(),
      email: cleanEmail,
      passwordHash: finalHash,
    });

    // Also sync user with Cloudflare backend D1 database
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_API_URL ||
        "https://lshorter-api.fiatechnologiecam.workers.dev";
      const secret = process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

      await fetch(`${backendUrl}/api/v1/users/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Frontend-Secret": secret,
        },
        body: JSON.stringify({
          id: result.userId,
          name: name.trim(),
          email: cleanEmail,
          provider: "credentials",
        }),
      });
    } catch (syncErr) {
      console.error("Cloudflare user sync error (ignoring):", syncErr);
    }

    return NextResponse.json({ success: true, userId: result.userId }, { status: 201 });
  } catch (err: any) {
    const message = err?.message || "Server error.";
    if (message.includes("EMAIL_ALREADY_EXISTS")) {
      return NextResponse.json({ error: "An account already exists with this email address. Please sign in." }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
