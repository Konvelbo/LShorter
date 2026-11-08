import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

export const revalidate = 31536000;

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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return new Response("Image ID missing", { status: 400 });
    }

    // Clean image ID if full URL or path was sent
    const cleanId = (id.split("?")[0].split("/").pop() || id).trim();
    if (!cleanId) {
      return new Response("Image ID missing", { status: 400 });
    }

    // Fast path: Default banner static asset bypass (< 5ms response, zero worker cold start)
    if (cleanId === "default_banner.jpg" || cleanId.startsWith("default_banner")) {
      try {
        const defaultBannerPath = path.join(process.cwd(), "public", "default_banner.jpg");
        if (fs.existsSync(defaultBannerPath)) {
          const buffer = fs.readFileSync(defaultBannerPath);
          return new Response(buffer, {
            status: 200,
            headers: {
              "Content-Type": "image/jpeg",
              "Content-Length": buffer.length.toString(),
              "Cache-Control": "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable",
              "CDN-Cache-Control": "public, max-age=31536000, immutable",
              "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
              "Cross-Origin-Resource-Policy": "cross-origin",
              "X-Content-Type-Options": "nosniff",
            },
          });
        }
      } catch (e) {
        console.warn("[Cloud Image Proxy] Static default banner read fallback:", e);
      }
    }

    const buildImageResponse = (
      buffer: ArrayBuffer | Buffer,
      contentType: string,
    ) => {
      const byteLength =
        buffer instanceof ArrayBuffer ? buffer.byteLength : buffer.length;
      const isSvg = contentType.includes("svg");
      return new Response(buffer as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": byteLength.toString(),
          "Cache-Control": "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable",
          "CDN-Cache-Control": "public, max-age=31536000, immutable",
          "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Cross-Origin-Resource-Policy": "cross-origin",
          "X-Content-Type-Options": "nosniff",
          ...(isSvg
            ? {
                "Content-Security-Policy":
                  "default-src 'none'; style-src 'unsafe-inline'; sandbox",
              }
            : {}),
        },
      });
    };

    // 1. Stream directly from Cloudflare Worker / Cloud Storage with Edge caching
    try {
      const workerRes = await fetch(
        `${WORKER_URL}/api/v1/images/${encodeURIComponent(cleanId)}`,
        {
          headers: {
            "X-Frontend-Secret": FRONTEND_SECRET,
          },
          next: { revalidate: 31536000 },
        },
      );

      if (workerRes.ok) {
        const contentType =
          workerRes.headers.get("content-type") || getMimeType(cleanId);
        const imageBuffer = await workerRes.arrayBuffer();
        return buildImageResponse(imageBuffer, contentType);
      }
    } catch (workerErr) {
      console.warn("[Cloud Image Proxy] Worker fetch error:", workerErr);
    }

    // 2. Fallback Worker Link Meta Query: If not in images table, query link metadata in Cloudflare
    try {
      const slugWithoutExt = cleanId.replace(
        /\.(jpg|jpeg|png|webp|gif|svg)$/i,
        "",
      );
      const linkRes = await fetch(
        `${WORKER_URL}/api/v1/links/${encodeURIComponent(slugWithoutExt)}`,
        {
          headers: {
            "X-Frontend-Secret": FRONTEND_SECRET,
            Authorization: `Bearer ${FRONTEND_SECRET}`,
          },
          next: { revalidate: 300 },
        },
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const rawImg =
        linkRes?.data?.og_image ||
        linkRes?.data?.ogImage ||
        linkRes?.og_image ||
        linkRes?.ogImage ||
        "";

      if (rawImg && rawImg.startsWith("data:")) {
        const commaIdx = rawImg.indexOf(",");
        const meta = rawImg.substring(0, commaIdx);
        const base64Data = rawImg.substring(commaIdx + 1);
        const mimeMatch = meta.match(/data:([^;,]+)/);
        const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
        const buffer = Buffer.from(base64Data, "base64");
        return buildImageResponse(buffer, mime);
      } else if (rawImg) {
        const internalMatch = rawImg.match(
          /\/(?:api\/(?:v1\/)?images|banners)\/([^/?#]+)/i,
        );
        if (internalMatch && internalMatch[1]) {
          const targetFile = internalMatch[1];
          if (targetFile !== cleanId && targetFile !== "og.png" && targetFile !== "og") {
            const linkedWorkerRes = await fetch(
              `${WORKER_URL}/api/v1/images/${encodeURIComponent(targetFile)}`,
              {
                headers: {
                  "X-Frontend-Secret": FRONTEND_SECRET,
                },
                next: { revalidate: 31536000 },
              },
            );
            if (linkedWorkerRes.ok) {
              const contentType =
                linkedWorkerRes.headers.get("content-type") ||
                getMimeType(targetFile);
              const imageBuffer = await linkedWorkerRes.arrayBuffer();
              return buildImageResponse(imageBuffer, contentType);
            }
          }
        } else if (
          rawImg.startsWith("http://") ||
          rawImg.startsWith("https://")
        ) {
          return NextResponse.redirect(rawImg, 302);
        }
      }
    } catch (fallbackWorkerErr) {
      console.warn(
        "[Cloud Image Proxy Worker Link Fallback Error]:",
        fallbackWorkerErr,
      );
    }

    return new Response("Image not found", {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("[Cloud Image Proxy Error]:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function HEAD(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const res = await GET(req, context);
  return new Response(null, {
    status: res.status,
    headers: res.headers,
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Frontend-Secret",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  });
}
