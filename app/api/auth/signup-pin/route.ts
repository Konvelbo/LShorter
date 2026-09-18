import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sendSignupVerificationPinEmail } from "@/lib/resend";
import { convexHttp } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // ── 1. SEND PIN ─────────────────────────────────────────────────────────────
    if (action === "send") {
      const { name, email, password } = body;
      const cleanEmail = String(email || "").trim().toLowerCase();
      const cleanName = String(name || "").trim();

      if (!cleanEmail) {
        return NextResponse.json(
          { success: false, message: "Email address is required." },
          { status: 400 }
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return NextResponse.json(
          { success: false, message: "Invalid email address format." },
          { status: 400 }
        );
      }

      if (!password || password.length < 8) {
        return NextResponse.json(
          { success: false, message: "Password must be at least 8 characters long." },
          { status: 400 }
        );
      }

      // Check if user already exists
      try {
        const existingUser = await convexHttp.query(api.users.getUserByEmail, {
          email: cleanEmail,
        });

        if (existingUser) {
          return NextResponse.json(
            {
              success: false,
              message: "An account already exists with this email address. Please sign in.",
            },
            { status: 409 }
          );
        }
      } catch (checkErr: any) {
        console.warn("[signup-pin] Check existing user warning:", checkErr);
      }

      // Securely hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Generate 6-digit numeric PIN
      const pin = Math.floor(100000 + Math.random() * 900000).toString();

      // Store in Convex with 15-min expiration
      await convexHttp.mutation(api.users.createSignupVerificationToken, {
        name: cleanName || cleanEmail.split("@")[0],
        email: cleanEmail,
        passwordHash,
        pin,
      });

      // Send PIN email via Resend
      const emailResult = await sendSignupVerificationPinEmail({
        to: cleanEmail,
        pin,
        name: cleanName,
      });

      if (!emailResult.success) {
        console.error("[signup-pin] Email delivery failed:", emailResult.error);
        return NextResponse.json(
          {
            success: false,
            message: "Failed to send confirmation email. Please verify your email address.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "A 6-digit verification PIN has been sent to your email!",
        email: cleanEmail,
      });
    }

    // ── 2. VERIFY PIN ───────────────────────────────────────────────────────────
    if (action === "verify") {
      const { email, pin } = body;
      const cleanEmail = String(email || "").trim().toLowerCase();
      const cleanPin = String(pin || "").trim();

      if (!cleanEmail || cleanPin.length !== 6) {
        return NextResponse.json(
          { success: false, valid: false, message: "Invalid PIN code (6 digits required)." },
          { status: 400 }
        );
      }

      const result = await convexHttp.query(api.users.verifySignupVerificationToken, {
        email: cleanEmail,
        pin: cleanPin,
      });

      return NextResponse.json({
        success: true,
        valid: result.valid,
        message: result.valid ? "PIN valid." : "Invalid or expired PIN code.",
      });
    }

    // ── 3. COMPLETE SIGNUP ──────────────────────────────────────────────────────
    if (action === "complete") {
      const { email, pin } = body;
      const cleanEmail = String(email || "").trim().toLowerCase();
      const cleanPin = String(pin || "").trim();

      if (!cleanEmail || cleanPin.length !== 6) {
        return NextResponse.json(
          { success: false, message: "Please provide a valid 6-digit PIN code." },
          { status: 400 }
        );
      }

      const result = await convexHttp.mutation(api.users.completeSignupWithVerificationPin, {
        email: cleanEmail,
        pin: cleanPin,
      });

      if (!result?.success || !result.userId) {
        return NextResponse.json(
          { success: false, message: "Could not finalize registration. Please try again." },
          { status: 400 }
        );
      }

      // Sync user with backend D1 database (non-blocking)
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
            name: result.name,
            email: cleanEmail,
            provider: "credentials",
          }),
        });
      } catch (syncErr) {
        console.warn("[signup-pin] Cloudflare sync non-fatal warning:", syncErr);
      }

      return NextResponse.json({
        success: true,
        message: "Account created and activated successfully!",
        userId: result.userId,
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action requested." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[signup-pin route] Error:", err);
    const msg = err?.message || "Server error during registration.";
    if (msg.includes("EMAIL_ALREADY_EXISTS")) {
      return NextResponse.json(
        { success: false, message: "This email address is already registered. Please log in." },
        { status: 409 }
      );
    }
    if (msg.includes("INVALID_OR_EXPIRED_PIN")) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired PIN code." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}
