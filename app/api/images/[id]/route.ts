import { NextResponse } from "next/server";

const WORKER_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";
const FRONTEND_SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

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

    const workerRes = await fetch(`${WORKER_URL}/api/v1/images/${cleanId}`, {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
      },
      cache: "force-cache",
    });

    if (!workerRes.ok) {
      return new Response("Image not found", {
        status: workerRes.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const contentType = workerRes.headers.get("content-type") || "image/png";
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
