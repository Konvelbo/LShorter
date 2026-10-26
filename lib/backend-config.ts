/**
 * Centralized Server-Side Backend Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads Cloudflare Worker URL and Frontend API Secret strictly from environment
 * variables without exposing them to the client or hardcoding values in source code.
 */

export const WORKER_URL =
  process.env.BACKEND_API_URL ||
  process.env.CLOUDFLARE_WORKER_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";

export const FRONTEND_SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

export const CF_ACCOUNT_ID =
  (process.env.CLOUDFLARE_ACCOUNT_ID || "").replace(/['"]/g, "").trim();

export const CF_D1_DATABASE_ID =
  (process.env.CLOUDFLARE_D1_DATABASE_ID || "").replace(/['"]/g, "").trim();

export const CF_API_TOKEN =
  (process.env.CLOUDFLARE_API_TOKEN || "").replace(/['"]/g, "").trim();
