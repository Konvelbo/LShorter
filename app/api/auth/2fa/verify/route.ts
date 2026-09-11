import { NextResponse } from "next/server";
import {
  generateBase32Secret,
  formatBase32Secret,
  generateTotpUri,
  verifyTotp,
  generateRecoveryCodes,
} from "@/lib/totp";
import QRCode from "qrcode";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Generate 2FA Secret + QR Code + Recovery Codes
    if (action === "generate") {
      const email = body.email || "user@lshorter.io";
      const name = body.name || "LShorter User";
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
      if (!secret || !code) {
        return NextResponse.json(
          { success: false, error: "Secret et code à 6 chiffres requis" },
          { status: 400 }
        );
      }

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
