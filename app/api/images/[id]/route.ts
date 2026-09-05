import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKER_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";
const FRONTEND_SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    default:
      return "image/jpeg";
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return new Response("Image ID missing", { status: 400 });
    }

    // Clean image id if full URL or path was passed
    const cleanId = id.split("/").pop() || id;

    // 1. Check local public/uploads directory first for fastest response on localhost
    try {
      const localFilePath = path.join(process.cwd(), "public", "uploads", cleanId);
      if (fs.existsSync(localFilePath)) {
        const fileBuffer = fs.readFileSync(localFilePath);
        const mimeType = getMimeType(cleanId);
        return new Response(fileBuffer, {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
            "Cross-Origin-Resource-Policy": "cross-origin",
          },
        });
      }
    } catch {}

    // 2. Fetch from Cloudflare Worker CDN / R2
    try {
      const workerRes = await fetch(`${WORKER_URL}/api/v1/images/${cleanId}`, {
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET,
        },
        cache: "force-cache",
      });

      if (workerRes.ok) {
        const contentType = workerRes.headers.get("content-type") || getMimeType(cleanId);
        const imageBuffer = await workerRes.arrayBuffer();

        // Save local copy to public/uploads for future cache hits
        try {
          const uploadsDir = path.join(process.cwd(), "public", "uploads");
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          fs.writeFileSync(path.join(uploadsDir, cleanId), Buffer.from(imageBuffer));
        } catch {}

        return new Response(imageBuffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Cross-Origin-Resource-Policy": "cross-origin",
          },
        });
      }
    } catch (workerErr) {
      console.warn("[Image Proxy] Worker fetch error:", workerErr);
    }

    // 3. Fallback: Fetch from Convex or Local Protected Link Store
    try {
      const slugWithoutExt = cleanId.replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, "");
      const { getProtectedLink } = await import("@/lib/protected-links-store");
      const localLink = getProtectedLink(slugWithoutExt);
      let rawImg = localLink?.ogImage || "";

      if (!rawImg) {
        const { ConvexHttpClient } = await import("convex/browser");
        const { api } = await import("@/convex/_generated/api");
        const cx = new ConvexHttpClient(
          process.env.NEXT_PUBLIC_CONVEX_URL || "https://greedy-mastiff-107.convex.cloud"
        );
        const cxLink = await cx.query(api.links.getLinkBySlug, { slug: slugWithoutExt }).catch(() => null);
        rawImg = cxLink?.ogImage || "";
      }

      if (rawImg && rawImg.startsWith("data:")) {
        const commaIdx = rawImg.indexOf(",");
        const meta = rawImg.substring(0, commaIdx);
        const base64Data = rawImg.substring(commaIdx + 1);
        const mimeMatch = meta.match(/data:([^;,]+)/);
        const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
        const buffer = Buffer.from(base64Data, "base64");

        return new Response(buffer, {
          status: 200,
          headers: {
            "Content-Type": mime,
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
            "Cross-Origin-Resource-Policy": "cross-origin",
          },
        });
      } else if (rawImg && (rawImg.startsWith("http://") || rawImg.startsWith("https://"))) {
        return NextResponse.redirect(rawImg, 302);
      }
    } catch (fallbackErr) {
      console.warn("[Image Proxy Fallback Error]:", fallbackErr);
    }

    return new Response("Image not found", {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("[Image Proxy Error]:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Frontend-Secret",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  });
}
