/**
 * Centralized Server-Side Backend Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads Cloudflare Worker URL and Frontend API Secret strictly from environment
 * variables without exposing them to the client or hardcoding values in source code.
 */

export const WORKER_URL =
  process.env.BACKEND_API_URL ||
  process.env.CLOUDFLARE_WORKER_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";

export const FRONTEND_SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";
