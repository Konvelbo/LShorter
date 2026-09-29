import { NextRequest, NextResponse } from "next/server";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let base64Data = "";

    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => null);
      base64Data = body?.data || body?.image || "";
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData().catch(() => null);
      const file = formData?.get("file") as File | null;
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        const arrayBuf = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const fName = file.name || "image.jpg";
        const ext = fName.split(".").pop()?.toLowerCase() || "jpg";
        const mimeType = file.type || `image/${ext === "jpg" ? "jpeg" : ext}`;
        base64Data = `data:${mimeType};base64,${buffer.toString("base64")}`;
      }
    }

    if (!base64Data) {
      return NextResponse.json(
        { success: false, error: "No image data provided" },
        { status: 400 },
      );
    }

    // 100% Cloudflare Cloud Storage (D1 & KV) — No local disk storage
    const workerRes = await fetch(`${WORKER_URL}/api/v1/upload-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Frontend-Secret": FRONTEND_SECRET,
      },
      body: JSON.stringify({ data: base64Data }),
    });

    if (workerRes.ok) {
      const data = await workerRes.json();
      return NextResponse.json({
        success: true,
        url:
          data.url ||
          (data.imageId
            ? `https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/images/${data.imageId}`
            : ""),
        imageId: data.imageId,
      });
    }

    const errData = await workerRes.text().catch(() => "Worker upload failed");
    return NextResponse.json(
      { success: false, error: errData },
      { status: workerRes.status },
    );
  } catch (error: any) {
    console.error("[Upload Cloud Route Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to upload image to Cloudflare cloud" },
      { status: 500 },
    );
  }
}
