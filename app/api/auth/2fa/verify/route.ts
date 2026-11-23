import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  generateBase32Secret,
  formatBase32Secret,
  generateTotpUri,
  verifyTotp,
  generateRecoveryCodes,
} from "@/lib/totp";
import { checkRateLimit } from "@/lib/security-utils";
import QRCode from "qrcode";
import { parseBody, twoFaBodySchema } from "@/lib/api-schemas";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const rl = checkRateLimit(`2fa_verify:${session.user.id}`, 15, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many 2FA verification attempts. Please wait a minute." },
        { status: 429 }
      );
    }

    const { data: body, error: bodyError } = await parseBody(req, twoFaBodySchema);
    if (bodyError) return bodyError;

    const { action } = body;

    // 1. Generate 2FA Secret + QR Code + Recovery Codes
    if (action === "generate") {
      const email = session.user.email || body.email || "";
      const name = session.user.name || body.name || "LShorter User";
      const secret = generateBase32Secret(20); // 32 characters in Base32 (160 bits)
      const formattedSecret = formatBase32Secret(secret);
      const otpauthUrl = generateTotpUri({
        secret,
        accountName: email || name,
        issuer: "LShorter",
      });

      // Render crisp, high-definition QR Code data URL with dark foreground & light quiet zone
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      });

      const recoveryCodes = generateRecoveryCodes(8);

      return NextResponse.json({
        success: true,
        secret,
        formattedSecret,
        otpauthUrl,
        qrCode: qrCodeDataUrl,
        recoveryCodes,
      });
    }

    // 2. Live Verify TOTP Code
    if (action === "verify") {
      const { secret, code } = body;

      const isValid = verifyTotp(code, secret, 1); // tolerance +/- 30s
      return NextResponse.json({
        success: true,
        valid: isValid,
      });
    }

    return NextResponse.json(
      { success: false, error: "Action non reconnue" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[2FA API Route Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Erreur serveur 2FA" },
      { status: 500 }
    );
  }
}
