import { NextResponse } from "next/server";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

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
    const cleanId = id.split("/").pop() || id;

    // 1. Stream directly from Cloudflare Worker / Cloud Storage (Zero local filesystem)
    try {
      const workerRes = await fetch(`${WORKER_URL}/api/v1/images/${cleanId}`, {
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET,
        },
        cache: "no-store",
      });

      if (workerRes.ok) {
        const contentType =
          workerRes.headers.get("content-type") || getMimeType(cleanId);
        const imageBuffer = await workerRes.arrayBuffer();

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
      console.warn("[Cloud Image Proxy] Worker fetch error:", workerErr);
    }

    // 2. Fallback Worker Link Meta Query: If not in images table, query link metadata in Cloudflare
    try {
      const slugWithoutExt = cleanId.replace(
        /\.(jpg|jpeg|png|webp|gif|svg)$/i,
        "",
      );
      const linkRes = await fetch(
        `${WORKER_URL}/api/v1/links/${slugWithoutExt}`,
        {
          headers: {
            "X-Frontend-Secret": FRONTEND_SECRET,
            Authorization: `Bearer ${FRONTEND_SECRET}`,
          },
          cache: "no-store",
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

        return new Response(buffer, {
          status: 200,
          headers: {
            "Content-Type": mime,
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
            "Cross-Origin-Resource-Policy": "cross-origin",
          },
        });
      } else if (
        rawImg &&
        (rawImg.startsWith("http://") || rawImg.startsWith("https://"))
      ) {
        return NextResponse.redirect(rawImg, 302);
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
