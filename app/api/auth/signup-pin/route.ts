import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sendSignupVerificationPinEmail } from "@/lib/resend";
import { convexHttp } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import {
  createStatelessPinToken,
  verifyStatelessPinToken,
} from "@/lib/stateless-pin";

const SIGNUP_COOKIE_NAME = "lsh_signup_token";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // ── 1. SEND PIN (Stateless Option A) ───────────────────────────────────────
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

      // Create stateless signed HMAC token (15-min validity)
      const token = createStatelessPinToken(
        {
          name: cleanName || cleanEmail.split("@")[0],
          email: cleanEmail,
          passwordHash,
          pin,
          type: "signup",
        },
        15
      );

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

      const response = NextResponse.json({
        success: true,
        message: "A 6-digit verification PIN has been sent to your email!",
        email: cleanEmail,
        token,
      });

      response.cookies.set(SIGNUP_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60,
        path: "/",
      });

      return response;
    }

    // ── 2. VERIFY PIN (Stateless Option A) ─────────────────────────────────────
    if (action === "verify") {
      const { email, pin, token: clientToken } = body;
      const cleanEmail = String(email || "").trim().toLowerCase();
      const cleanPin = String(pin || "").trim();

      if (!cleanEmail || cleanPin.length !== 6) {
        return NextResponse.json(
          { success: false, valid: false, message: "Invalid PIN code (6 digits required)." },
          { status: 400 }
        );
      }

      const token = clientToken || req.cookies.get(SIGNUP_COOKIE_NAME)?.value;
      if (!token) {
        return NextResponse.json({
          success: true,
          valid: false,
          message: "Verification session expired (15 min validity). Please request a new PIN.",
        });
      }

      const result = verifyStatelessPinToken(token, cleanPin);
      if (!result.valid || !result.payload) {
        let message = "Invalid PIN code.";
        if (result.reason === "TOKEN_EXPIRED") {
          message = "This PIN code has expired (15 min validity). Please request a new one.";
        }
        return NextResponse.json({ success: true, valid: false, message });
      }

      if (result.payload.email !== cleanEmail || result.payload.type !== "signup") {
        return NextResponse.json({
          success: true,
          valid: false,
          message: "Email mismatch for this verification session.",
        });
      }

      return NextResponse.json({
        success: true,
        valid: true,
        name: result.payload.name,
        message: "PIN valid.",
      });
    }

    // ── 3. COMPLETE SIGNUP (Stateless Option A) ────────────────────────────────
    if (action === "complete") {
      const { email, pin, token: clientToken } = body;
      const cleanEmail = String(email || "").trim().toLowerCase();
      const cleanPin = String(pin || "").trim();

      if (!cleanEmail || cleanPin.length !== 6) {
        return NextResponse.json(
          { success: false, message: "Please provide a valid 6-digit PIN code." },
          { status: 400 }
        );
      }

      const token = clientToken || req.cookies.get(SIGNUP_COOKIE_NAME)?.value;
      if (!token) {
        return NextResponse.json(
          { success: false, message: "Verification session expired. Please request a new PIN code." },
          { status: 400 }
        );
      }

      const result = verifyStatelessPinToken(token, cleanPin);
      if (!result.valid || !result.payload) {
        let message = "Invalid or expired PIN code.";
        if (result.reason === "TOKEN_EXPIRED") {
          message = "This PIN code has expired. Please request a new one.";
        }
        return NextResponse.json({ success: false, message }, { status: 400 });
      }

      if (result.payload.email !== cleanEmail || result.payload.type !== "signup") {
        return NextResponse.json(
          { success: false, message: "Session email mismatch. Please try again." },
          { status: 400 }
        );
      }

      if (!result.payload.passwordHash) {
        return NextResponse.json(
          { success: false, message: "Registration session corrupted. Please sign up again." },
          { status: 400 }
        );
      }

      // Directly insert user into Convex users table
      const createdUser = await convexHttp.mutation(api.users.createUserWithVerifiedEmail, {
        name: result.payload.name || cleanEmail.split("@")[0],
        email: cleanEmail,
        passwordHash: result.payload.passwordHash,
      });

      if (!createdUser?.success || !createdUser.userId) {
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
            id: createdUser.userId,
            name: createdUser.name,
            email: cleanEmail,
            provider: "credentials",
          }),
        });
      } catch (syncErr) {
        console.warn("[signup-pin] Cloudflare sync non-fatal warning:", syncErr);
      }

      const response = NextResponse.json({
        success: true,
        message: "Account created and activated successfully!",
        userId: createdUser.userId,
      });

      // Clear cookie
      response.cookies.delete(SIGNUP_COOKIE_NAME);

      return response;
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
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}
