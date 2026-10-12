import { Environment, Paddle, LogLevel } from "@paddle/paddle-node-sdk";

let paddleInstance: Paddle | null = null;

/**
 * Returns a configured server-side instance of the Paddle Node SDK.
 * Defaults to the sandbox environment unless NEXT_PUBLIC_PADDLE_ENVIRONMENT is explicitly 'production'.
 */
export function getPaddleInstance(): Paddle | null {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Paddle Server] PADDLE_API_KEY is not defined in environment variables.");
    }
    return null;
  }

  if (paddleInstance) {
    return paddleInstance;
  }

  const isProduction = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "production";

  paddleInstance = new Paddle(apiKey, {
    environment: isProduction ? Environment.production : Environment.sandbox,
    logLevel: process.env.NODE_ENV === "development" ? LogLevel.verbose : LogLevel.error,
  });

  return paddleInstance;
}

/**
 * Verifies an incoming Paddle webhook signature using the official SDK unmarshal method.
 */
export async function verifyPaddleWebhook(
  rawBody: string,
  signatureHeader: string
) {
  const secretKey = process.env.PADDLE_WEBHOOK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PADDLE_WEBHOOK_SECRET_KEY is not defined in environment variables");
  }

  const paddle = getPaddleInstance();
  if (!paddle) {
    throw new Error("Paddle SDK could not be initialized (missing PADDLE_API_KEY)");
  }

  return await paddle.webhooks.unmarshal(rawBody, secretKey, signatureHeader);
}
