import { NextRequest, NextResponse } from "next/server";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import bcrypt from "bcryptjs";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { parseBody, registerBodySchema } from "@/lib/api-schemas";
import { verifyStatelessPinToken } from "@/lib/stateless-pin";
import {
  GUEST_COOKIE_NAME,
  verifyGuestToken,
  getClientIpHash,
  claimGuestLinksForUser,
} from "@/lib/guest-links";

export async function POST(req: NextRequest) {
  try {
    const { data: body, error } = await parseBody(req, registerBodySchema);
    if (error) return error;

    const { name, email, password, passwordHash, pin, token: bodyToken } = body;
    const signupToken = bodyToken || req.cookies.get("lsh_signup_token")?.value;

    // Security: Prevent unverified account creation bypass (require stateless email PIN verification)
    if (!signupToken || !pin) {
      return NextResponse.json(
        {
          success: false,
          code: "PIN_VERIFICATION_REQUIRED",
          error: "Email verification PIN is required. Please register via /api/auth/signup-pin.",
        },
        { status: 403 }
      );
    }

    const pinResult = verifyStatelessPinToken(signupToken, pin);
    if (
      !pinResult.valid ||
      !pinResult.payload ||
      pinResult.payload.type !== "signup" ||
      pinResult.payload.email !== email.toLowerCase().trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PIN_TOKEN",
          error: "Invalid or expired email verification PIN.",
        },
        { status: 403 }
      );
    }
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 50) {
      return NextResponse.json({ error: "Your name must be between 2 and 50 characters." }, { status: 400 });
    }

    const cleanEmail = email;
    let finalHash = passwordHash;
    if (password) {
      finalHash = await bcrypt.hash(password, 10);
    } else if (passwordHash && !passwordHash.startsWith("$2")) {
      finalHash = await bcrypt.hash(passwordHash, 10);
    }

    const result = await convex.mutation(api.users.registerWithEmail, {
      name: cleanName,
      email: cleanEmail,
      passwordHash: finalHash ?? "",
    });

    // Also sync user with Cloudflare backend D1 database
    try {
      await fetch(`${WORKER_URL}/api/v1/users/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Frontend-Secret": FRONTEND_SECRET,
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

    // Send welcome email immediately upon registration
    try {
      const { sendWelcomeEmail } = await import("@/lib/resend");
      const welcomeRes = await sendWelcomeEmail({
        to: cleanEmail,
        name: name.trim(),
      });
      if (welcomeRes.success && (result as any)?.welcomeEmailId) {
        await convex.mutation(api.users.markWelcomeEmailSent, {
          id: (result as any).welcomeEmailId,
        });
      }
    } catch (welcomeErr) {
      console.warn("[register] Instant welcome email warning:", welcomeErr);
    }

    // Immediately claim any Hero short link created before registration into the new user's dashboard
    let claimedCount = 0;
    try {
      const guestToken = req.cookies.get(GUEST_COOKIE_NAME)?.value;
      const guestId = verifyGuestToken(guestToken);
      const ipHash = getClientIpHash(req);
      const claimRes = await claimGuestLinksForUser({
        guestId,
        ipHash,
        userId: result.userId,
        userEmail: cleanEmail,
        userName: cleanName,
        userPlan: "FREE",
      });
      claimedCount = claimRes.claimedCount;
    } catch (claimErr) {
      console.warn("[register] Guest link auto-claim warning:", claimErr);
    }

    const res = NextResponse.json(
      { success: true, userId: result.userId, claimedCount },
      { status: 201 }
    );
    if (claimedCount > 0) {
      res.cookies.delete(GUEST_COOKIE_NAME);
    }
    return res;
  } catch (err: any) {
    const message = (err?.message || err?.data || String(err) || "Server error.").toString();
    if (message.includes("EMAIL_ALREADY_EXISTS") || message.toLowerCase().includes("already exists")) {
      return NextResponse.json({ error: "An account already exists with this email address. Please sign in." }, { status: 409 });
    }
    if (message.includes("USERNAME_LENGTH_INVALID")) {
      return NextResponse.json({ error: "Username must be between 2 and 50 characters." }, { status: 400 });
    }
    console.error("[register] Registration unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred during registration. Please try again later." }, { status: 500 });
  }
}
