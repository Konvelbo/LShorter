import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  isSafeHttpUrl,
  validateSvgSafety,
} from "@/lib/security-utils";

const MAX_OG_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const DATA_URI_REGEX = /^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/;

function isOwnBannerOrigin(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    return (
      host === "lsho.cc" ||
      host === "www.lsho.cc" ||
      host.endsWith(".lsho.cc") ||
      host.endsWith(".workers.dev") ||
      host === "localhost" ||
      host === "127.0.0.1"
    );
  } catch {
    return false;
  }
}

export type OgImageValidationResult =
  | { ok: true; value: string | null | undefined }
  | { ok: false; status: number; error: string };

/**
 * Strictly validates an incoming `ogImage` / `og_image` field on link create/update:
 * - Rejects non-string/non-null types cleanly
 * - Rejects any non-image `data:` URI (e.g. `data:text/html`) to prevent Stored XSS
 * - Enforces ALLOWED_IMAGE_MIME_TYPES, 5MB limit, and SVG safety on `data:image/` URIs
 * - Persists validated `data:image/` URIs to Cloudflare Edge Storage and returns an error on upload failure
 * - Only normalizes `/banners/` or `/api/images/` paths when relative or on LShorter/Worker hosts
 * - Enforces `isSafeHttpUrl()` on all external HTTP(S) URLs
 */
export async function validateAndPersistOgImage(
  rawInput: unknown,
  explicitClear: boolean,
  userId?: string,
): Promise<OgImageValidationResult> {
  if (explicitClear) {
    return { ok: true, value: null };
  }
  if (rawInput === undefined || rawInput === null || rawInput === "") {
    return { ok: true, value: undefined };
  }
  if (typeof rawInput !== "string") {
    return {
      ok: false,
      status: 400,
      error: "Invalid banner image format.",
    };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { ok: true, value: undefined };
  }

  // 1. Handle Data URIs strictly (never allow non-image MIME types like text/html)
  if (trimmed.toLowerCase().startsWith("data:")) {
    if (trimmed.length > MAX_OG_IMAGE_BYTES * 1.4) {
      return {
        ok: false,
        status: 413,
        error: "La taille de la bannière dépasse la limite de 5 Mo.",
      };
    }

    const match = trimmed.match(DATA_URI_REGEX);
    if (!match) {
      return {
        ok: false,
        status: 400,
        error: "Format d'image invalide. Seules les images JPEG, PNG, WebP, GIF ou SVG encodées en base64 sont autorisées.",
      };
    }

    const mime = match[1].toLowerCase();
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(mime as any)) {
      return {
        ok: false,
        status: 400,
        error: "Type de fichier non supporté pour la bannière.",
      };
    }

    if (mime === "image/svg+xml") {
      const svgContent = Buffer.from(match[2], "base64").toString("utf-8");
      const safety = validateSvgSafety(svgContent);
      if (!safety.isSafe) {
        return {
          ok: false,
          status: 400,
          error: safety.reason || "Contenu SVG non sécurisé rejeté.",
        };
      }
    }

    // Upload validated image to Cloudflare Edge Storage
    try {
      const upRes = await fetch(`${WORKER_URL}/api/v1/upload-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Frontend-Secret": FRONTEND_SECRET || "",
          Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
          ...(userId ? { "X-User-Id": userId } : {}),
        },
        body: JSON.stringify({ data: trimmed }),
        cache: "no-store",
      });

      if (!upRes.ok) {
        return {
          ok: false,
          status: 502,
          error: "Impossible d'enregistrer l'image de bannière sur le stockage Cloudflare. Veuillez réessayer.",
        };
      }

      const upJson = await upRes.json().catch(() => ({}));
      const rawUploaded = String(upJson?.url || "");
      const extractedFile =
        rawUploaded.split("?")[0].split("/").pop() ||
        (upJson?.imageId ? String(upJson.imageId) : "");
      if (!extractedFile || !/^[a-zA-Z0-9._-]+$/.test(extractedFile)) {
        return {
          ok: false,
          status: 502,
          error: "Réponse invalide du stockage d'images Cloudflare.",
        };
      }
      return { ok: true, value: `/banners/${extractedFile}` };
    } catch {
      return {
        ok: false,
        status: 502,
        error: "Impossible de contacter le stockage d'images Cloudflare. Veuillez réessayer.",
      };
    }
  }

  // 2. Relative internal banner paths
  if (trimmed.startsWith("/")) {
    if (
      trimmed.startsWith("/banners/") ||
      trimmed.startsWith("/api/images/") ||
      trimmed.startsWith("/api/v1/images/")
    ) {
      const [pathPart, queryPart] = trimmed.split("?");
      const fName = pathPart.split("/").pop();
      if (fName && fName !== "og.png" && fName !== "og" && /^[a-zA-Z0-9._-]+$/.test(fName)) {
        return { ok: true, value: `/banners/${fName}${queryPart ? `?${queryPart}` : ""}` };
      }
      if (fName === "og.png" || fName === "og") {
        return { ok: true, value: undefined };
      }
    }
    if (
      trimmed === "/default_banner.jpg" ||
      trimmed === "/og-image.png" ||
      trimmed === "/lshorter-launch-banner-2026.png"
    ) {
      return { ok: true, value: trimmed };
    }
    return {
      ok: false,
      status: 400,
      error: "Chemin de bannière interne non autorisé.",
    };
  }

  // 3. Absolute HTTP(S) URLs
  if (!isSafeHttpUrl(trimmed)) {
    return {
      ok: false,
      status: 400,
      error: "URL de bannière invalide. Seuls les liens HTTP/HTTPS sécurisés sont autorisés.",
    };
  }

  // Only normalize `/banners/` or `/api/images/` paths when pointing at LShorter/Worker hosts
  if (
    isOwnBannerOrigin(trimmed) &&
    (trimmed.includes("/api/images/") ||
      trimmed.includes("/api/v1/images/") ||
      trimmed.includes("/banners/"))
  ) {
    const [pathPart, queryPart] = trimmed.split("?");
    const fName = pathPart.split("/").pop();
    if (fName && fName !== "og.png" && fName !== "og" && /^[a-zA-Z0-9._-]+$/.test(fName)) {
      return { ok: true, value: `/banners/${fName}${queryPart ? `?${queryPart}` : ""}` };
    }
  }

  return { ok: true, value: trimmed };
}
