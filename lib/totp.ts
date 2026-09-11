const RFC4648_BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function getCryptoModule() {
  if (typeof globalThis !== "undefined" && (globalThis as any).crypto?.getRandomValues) {
    return (globalThis as any).crypto;
  }
  try {
    return require("crypto");
  } catch {
    return null;
  }
}

/**
 * Generates a cryptographically secure RFC 4648 Base32 secret string.
 * Default 20 bytes = 32 Base32 characters (160-bit security).
 */
export function generateBase32Secret(byteLength = 20): string {
  const bytes = new Uint8Array(byteLength);
  const cryptoObj = getCryptoModule();
  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(bytes);
  } else if (cryptoObj?.randomBytes) {
    bytes.set(cryptoObj.randomBytes(byteLength));
  } else {
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      output += RFC4648_BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += RFC4648_BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string into raw bytes.
 */
export function base32ToBytes(base32: string): Uint8Array {
  const clean = (base32 || "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = RFC4648_BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) continue;

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Formats a Base32 key with spaces every 4 characters for human readability.
 * E.g. "JBSWY3DPEHPK3PXP" -> "JBSW Y3DP EHPK 3PXP"
 */
export function formatBase32Secret(secret: string): string {
  const clean = (secret || "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  return clean.match(/.{1,4}/g)?.join(" ") || clean;
}

/**
 * Builds the standard otpauth:// URL compliant with Google Authenticator,
 * Microsoft Authenticator, Apple Passwords, Authy, 1Password, Bitwarden, etc.
 */
export function generateTotpUri(options: {
  secret: string;
  accountName: string;
  issuer?: string;
}): string {
  const cleanSecret = (options.secret || "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  const issuer = options.issuer || "LShorter";
  const label = `${issuer}:${options.accountName.trim()}`;
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${cleanSecret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Computes a 6-digit TOTP code for a given timestamp offset window (RFC 6238).
 */
export function generateTotpCode(secretBase32: string, timeOffsetWindows = 0): string {
  const keyBytes = base32ToBytes(secretBase32);
  if (keyBytes.length === 0) return "";

  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = 30;
  const counter = Math.floor(epoch / timeStep) + timeOffsetWindows;

  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigInt64BE(BigInt(counter), 0);

  const nodeCrypto = getCryptoModule();
  if (!nodeCrypto?.createHmac) return "";

  const hmac = nodeCrypto.createHmac("sha1", Buffer.from(keyBytes)).update(counterBuf).digest();

  // Dynamic truncation (RFC 4226)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * Verifies a 6-digit TOTP token against a Base32 secret.
 * Allows +/- window periods (default 1 = +/-30s tolerance for clock drift).
 */
export function verifyTotp(token: string, secretBase32: string, window = 1): boolean {
  if (!token || !secretBase32) return false;
  const cleanToken = token.trim().replace(/\s+/g, "");
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) return false;

  for (let i = -window; i <= window; i++) {
    const expected = generateTotpCode(secretBase32, i);
    if (expected && expected === cleanToken) {
      return true;
    }
  }
  return false;
}

/**
 * Generates emergency backup / recovery codes (8 single-use codes).
 */
export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Disambiguated alphabet
  for (let i = 0; i < count; i++) {
    let part1 = "";
    let part2 = "";
    for (let j = 0; j < 4; j++) {
      part1 += chars[Math.floor(Math.random() * chars.length)];
      part2 += chars[Math.floor(Math.random() * chars.length)];
    }
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

/**
 * Checks if a candidate code matches any active recovery code (ignoring dashes and case).
 */
export function matchRecoveryCode(
  candidate: string,
  recoveryCodes: string[]
): { matched: boolean; remainingCodes: string[] } {
  if (!candidate || !Array.isArray(recoveryCodes)) {
    return { matched: false, remainingCodes: recoveryCodes || [] };
  }

  const cleanCandidate = candidate.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const matchIndex = recoveryCodes.findIndex(
    (c) => c.toUpperCase().replace(/[^A-Z0-9]/g, "") === cleanCandidate
  );

  if (matchIndex === -1) {
    return { matched: false, remainingCodes: recoveryCodes };
  }

  const remainingCodes = [...recoveryCodes];
  remainingCodes.splice(matchIndex, 1);
  return { matched: true, remainingCodes };
}
