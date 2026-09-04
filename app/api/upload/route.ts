import { NextResponse } from "next/server";

const WORKER_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";
const FRONTEND_SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let res: Response;
    if (contentType.includes("application/json")) {
      const body = await req.json();
      res = await fetch(`${WORKER_URL}/api/v1/upload-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Frontend-Secret": FRONTEND_SECRET,
        },
        body: JSON.stringify(body),
      });
    } else {
      const formData = await req.formData();
      res = await fetch(`${WORKER_URL}/api/v1/upload-image`, {
        method: "POST",
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET,
        },
        body: formData,
      });
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data?.error || "Erreur upload" },
        { status: res.status }
      );
    }

    let imageUrl = data.url || "";
    if (data.imageId) {
      imageUrl = `/api/images/${data.imageId}`;
    } else if (imageUrl.includes("/api/v1/images/")) {
      const imageId = imageUrl.split("/api/v1/images/")[1];
      imageUrl = `/api/images/${imageId}`;
    }

    return NextResponse.json({
      success: true,
      url: imageUrl,
      cdnUrl: data.url,
      imageId: data.imageId,
    });
  } catch (err: any) {
    console.error("[Upload API Proxy Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Erreur serveur upload" },
      { status: 500 }
    );
  }
}
