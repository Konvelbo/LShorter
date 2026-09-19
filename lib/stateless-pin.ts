import crypto from "crypto";

const SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "lshorter_stateless_pin_secret_key_2026";

export interface StatelessPinPayload {
  email: string;
  name?: string;
  passwordHash?: string;
  pinHash: string;
  salt: string;
  type: "signup" | "reset";
  expiresAt: number;
}

/**
 * Hashes a 6-digit PIN with a dedicated salt using SHA-256
 */
export function hashPin(pin: string, salt: string): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${salt}:${pin.trim()}`)
    .digest("hex");
}

/**
 * Creates a tamper-proof stateless token containing the encrypted/signed PIN verification metadata.
 * No database required. Valid for 15 minutes by default.
 */
export function createStatelessPinToken(
  params: {
    email: string;
    name?: string;
    passwordHash?: string;
    pin: string;
    type: "signup" | "reset";
  },
  expiresInMinutes: number = 15
): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const pinHash = hashPin(params.pin, salt);
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;

  const payload: StatelessPinPayload = {
    email: params.email.trim().toLowerCase(),
    name: params.name?.trim(),
    passwordHash: params.passwordHash,
    pinHash,
    salt,
    type: params.type,
    expiresAt,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a candidate PIN against a stateless token.
 */
export function verifyStatelessPinToken(
  token: string,
  candidatePin: string
): {
  valid: boolean;
  payload?: StatelessPinPayload;
  reason?: "INVALID_TOKEN" | "TOKEN_EXPIRED" | "INVALID_PIN" | "INVALID_FORMAT";
} {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false, reason: "INVALID_TOKEN" };
  }

  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) {
    return { valid: false, reason: "INVALID_TOKEN" };
  }

  // 1. Verify HMAC signature in constant time
  const expectedSignature = crypto
    .createHmac("sha256", SECRET)
    .update(payloadB64)
    .digest("base64url");

  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return { valid: false, reason: "INVALID_TOKEN" };
  }

  // 2. Decode payload
  let payload: StatelessPinPayload;
  try {
    const rawJson = Buffer.from(payloadB64, "base64url").toString("utf-8");
    payload = JSON.parse(rawJson);
  } catch {
    return { valid: false, reason: "INVALID_TOKEN" };
  }

  // 3. Check expiration
  if (!payload.expiresAt || Date.now() > payload.expiresAt) {
    return { valid: false, payload, reason: "TOKEN_EXPIRED" };
  }

  // 4. Check candidate PIN
  const cleanCandidate = (candidatePin || "").trim();
  if (cleanCandidate.length !== 6) {
    return { valid: false, payload, reason: "INVALID_FORMAT" };
  }

  const candidateHash = hashPin(cleanCandidate, payload.salt);
  if (
    candidateHash.length !== payload.pinHash.length ||
    !crypto.timingSafeEqual(Buffer.from(candidateHash), Buffer.from(payload.pinHash))
  ) {
    return { valid: false, payload, reason: "INVALID_PIN" };
  }

  return { valid: true, payload };
}
