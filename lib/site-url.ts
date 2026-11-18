/**
 * Normalized Canonical Site URL helper
 * Strips any trailing slashes and falls back safely to production https://lsho.cc
 */
export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes("localhost")) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "https://lsho.cc";
}
