/**
 * Bunny.net Storage & CDN Client
 * ─────────────────────────────────────────────────────────────────────────────
 * High-performance, ultra cost-effective media storage and CDN delivery
 * for LShorter (OpenGraph Banners, QR Code Logos, Avatars, Assets).
 */

export interface BunnyConfig {
  storageZoneName: string;
  apiKey: string;
  region?: string;
  cdnHostname: string;
}

export interface BunnyUploadResult {
  success: boolean;
  url: string;
  cdnUrl?: string;
  filename?: string;
  storagePath?: string;
  size?: number;
  error?: string;
}

/**
 * Returns the configured Bunny.net credentials from environment variables.
 */
export function getBunnyConfig(): BunnyConfig {
  const storageZoneName =
    process.env.BUNNY_STORAGE_ZONE_NAME ||
    process.env.BUNNY_ZONE_NAME ||
    process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE_NAME ||
    "lsho";

  const apiKey =
    process.env.BUNNY_STORAGE_API_KEY ||
    process.env.BUNNY_STORAGE_ACCESS_KEY ||
    process.env.BUNNY_STORAGE_PASSWORD ||
    process.env.BUNNY_API_KEY ||
    "d5a83fca-9021-46cd-b6a8506b0eff-22cf-45cc";

  const region = (
    process.env.BUNNY_STORAGE_REGION ||
    process.env.NEXT_PUBLIC_BUNNY_STORAGE_REGION ||
    "la"
  ).toLowerCase().trim();

  const cdnHostname =
    process.env.BUNNY_CDN_HOSTNAME ||
    process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME ||
    "lsho.b-cdn.net";

  return {
    storageZoneName,
    apiKey,
    region,
    cdnHostname,
  };
}

/**
 * Checks if Bunny.net Storage credentials are fully configured.
 */
export function isBunnyConfigured(): boolean {
  const config = getBunnyConfig();
  return Boolean(config.storageZoneName && config.apiKey);
}

/**
 * Resolves the Bunny Storage REST API base endpoint according to the selected region.
 */
export function getBunnyStorageEndpoint(region?: string): string {
  const r = (region || "").toLowerCase().trim();
  switch (r) {
    case "ny":
    case "us":
    case "us-east":
      return "https://ny.storage.bunnycdn.com";
    case "la":
    case "us-west":
      return "https://la.storage.bunnycdn.com";
    case "sg":
    case "singapore":
    case "asia":
      return "https://sg.storage.bunnycdn.com";
    case "syd":
    case "sydney":
    case "oceania":
      return "https://syd.storage.bunnycdn.com";
    case "uk":
    case "lon":
    case "london":
      return "https://uk.storage.bunnycdn.com";
    case "se":
    case "sto":
    case "stockholm":
      return "https://se.storage.bunnycdn.com";
    case "br":
    case "sao":
      return "https://br.storage.bunnycdn.com";
    case "jh":
    case "africa":
      return "https://jh.storage.bunnycdn.com";
    case "de":
    case "eu":
    case "falkenstein":
    default:
      return "https://storage.bunnycdn.com";
  }
}

/**
 * Uploads a file buffer or base64 data to Bunny.net Storage via the official REST API.
 */
export async function uploadToBunny(
  fileData: string | Buffer | ArrayBuffer | Uint8Array,
  options: {
    folder?: string;
    filename?: string;
    contentType?: string;
  } = {}
): Promise<BunnyUploadResult> {
  const config = getBunnyConfig();

  if (!config) {
    return {
      success: false,
      url: "",
      error:
        "Bunny.net non configuré. Veuillez définir BUNNY_STORAGE_ZONE_NAME et BUNNY_STORAGE_API_KEY dans votre fichier .env.local",
    };
  }

  let buffer: Buffer;
  let detectedMime = options.contentType || "image/jpeg";
  let extension = "jpg";

  // 1. Process base64 strings (Data URI or raw base64)
  if (typeof fileData === "string") {
    const commaIdx = fileData.indexOf(",");
    if (commaIdx !== -1) {
      const meta = fileData.substring(0, commaIdx);
      const raw = fileData.substring(commaIdx + 1);
      const mimeMatch = meta.match(/data:([^;,]+)/);
      if (mimeMatch) {
        detectedMime = mimeMatch[1];
      }
      buffer = Buffer.from(raw, "base64");
    } else {
      buffer = Buffer.from(fileData, "base64");
    }
  } else if (Buffer.isBuffer(fileData)) {
    buffer = fileData;
  } else if (fileData instanceof ArrayBuffer) {
    buffer = Buffer.from(fileData);
  } else if (fileData instanceof Uint8Array) {
    buffer = Buffer.from(fileData);
  } else {
    return {
      success: false,
      url: "",
      error: "Format de données invalide pour l'upload Bunny.net",
    };
  }

  // Derive file extension from MIME type
  if (detectedMime.includes("png")) extension = "png";
  else if (detectedMime.includes("webp")) extension = "webp";
  else if (detectedMime.includes("svg")) extension = "svg";
  else if (detectedMime.includes("gif")) extension = "gif";
  else if (detectedMime.includes("jpeg") || detectedMime.includes("jpg")) extension = "jpg";

  // Sanitize folder and filename
  const cleanFolder = (options.folder || "banners")
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-zA-Z0-9_\-\/]/g, "");

  const randomSlug = Math.random().toString(36).substring(2, 9);
  const cleanFilename =
    options.filename ||
    `banner_${Date.now()}_${randomSlug}.${extension}`;

  const storageEndpoint = getBunnyStorageEndpoint(config.region);
  const pathPart = cleanFolder ? `${cleanFolder}/${cleanFilename}` : cleanFilename;
  const uploadUrl = `${storageEndpoint}/${encodeURIComponent(config.storageZoneName)}/${pathPart}`;

  try {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: config.apiKey,
        "Content-Type": detectedMime,
      },
      body: new Uint8Array(buffer),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => res.statusText);
      console.error(`[Bunny.net Upload Error HTTP ${res.status}]:`, errorText);
      return {
        success: false,
        url: "",
        error: `Erreur Bunny.net Storage (${res.status}): ${errorText}`,
      };
    }

    // Build the fast global CDN public URL
    const host = config.cdnHostname || `${config.storageZoneName}.b-cdn.net`;
    const cdnBase = host.startsWith("http")
      ? host.replace(/\/+$/, "")
      : `https://${host.replace(/\/+$/, "")}`;

    const publicCdnUrl = `${cdnBase}/${pathPart}`;

    return {
      success: true,
      url: publicCdnUrl,
      cdnUrl: publicCdnUrl,
      filename: cleanFilename,
      storagePath: pathPart,
      size: buffer.length,
    };
  } catch (err: any) {
    console.error("[Bunny.net Upload Network Exception]:", err);
    return {
      success: false,
      url: "",
      error: err?.message || "Erreur de connexion avec Bunny.net Storage",
    };
  }
}

/**
 * Deletes a file from Bunny.net Storage.
 */
export async function deleteFromBunny(storagePath: string): Promise<boolean> {
  const config = getBunnyConfig();
  if (!config) return false;

  const storageEndpoint = getBunnyStorageEndpoint(config.region);
  const cleanPath = storagePath.replace(/^\/+/, "");
  const deleteUrl = `${storageEndpoint}/${encodeURIComponent(config.storageZoneName)}/${cleanPath}`;

  try {
    const res = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        AccessKey: config.apiKey,
      },
    });
    return res.ok;
  } catch (err) {
    console.error("[Bunny.net Delete Error]:", err);
    return false;
  }
}

/**
 * Returns an optimized OpenGraph URL using Bunny CDN / Optimizer features if available.
 */
export function getOptimizedBunnyOgUrl(url?: string): string {
  if (!url) return "";
  if (!url.includes("b-cdn.net")) return url;
  // If query parameters are not yet attached, we can specify width/height for Bunny Optimizer
  if (url.includes("?")) return url;
  return `${url}?width=1200&height=630&crop=1`;
}
