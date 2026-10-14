import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

import {
  ALLOWED_IMAGE_MIME_TYPES,
  validateSvgSafety,
} from "@/lib/security-utils";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let base64Data = "";
    let extractedMime = "";

    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => null);
      const raw = (body?.data || body?.image || "").trim();

      const dataUriMatch = raw.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/);
      if (!dataUriMatch) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid image format. Expected base64 Data URI with explicit MIME type.",
          },
          { status: 400 },
        );
      }

      extractedMime = dataUriMatch[1].toLowerCase();
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(extractedMime as any)) {
        return NextResponse.json(
          {
            success: false,
            error: "Unsupported file type. Only JPEG, PNG, WEBP, GIF, and SVG are allowed.",
          },
          { status: 400 },
        );
      }

      if (extractedMime === "image/svg+xml") {
        const svgContent = Buffer.from(dataUriMatch[2], "base64").toString("utf-8");
        const safetyCheck = validateSvgSafety(svgContent);
        if (!safetyCheck.isSafe) {
          return NextResponse.json(
            { success: false, error: safetyCheck.reason || "Unsafe SVG content rejected." },
            { status: 400 },
          );
        }
      }

      base64Data = raw;
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData().catch(() => null);
      const file = formData?.get("file") as File | null;
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            { success: false, error: "File exceeds 5MB size limit" },
            { status: 413 }
          );
        }
        const arrayBuf = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const fName = file.name || "image.jpg";
        const ext = fName.split(".").pop()?.toLowerCase() || "jpg";
        const mimeType = (file.type || `image/${ext === "jpg" ? "jpeg" : ext}`).toLowerCase();
        if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as any)) {
          return NextResponse.json(
            { success: false, error: "Unsupported file type. Only JPEG, PNG, WEBP, GIF, and SVG are allowed." },
            { status: 400 }
          );
        }

        if (mimeType === "image/svg+xml") {
          const svgContent = buffer.toString("utf-8");
          const safetyCheck = validateSvgSafety(svgContent);
          if (!safetyCheck.isSafe) {
            return NextResponse.json(
              { success: false, error: safetyCheck.reason || "Unsafe SVG content rejected." },
              { status: 400 },
            );
          }
        }

        base64Data = `data:${mimeType};base64,${buffer.toString("base64")}`;
      }
    }

    if (!base64Data) {
      return NextResponse.json(
        { success: false, error: "No image data provided" },
        { status: 400 },
      );
    }

    // Check payload size if base64 provided directly via JSON
    if (base64Data.length > MAX_FILE_SIZE_BYTES * 1.4) {
      return NextResponse.json(
        { success: false, error: "Image data exceeds 5MB size limit" },
        { status: 413 }
      );
    }

    // 100% Cloudflare Cloud Storage (D1 & KV) — No local disk storage
    const workerRes = await fetch(`${WORKER_URL}/api/v1/upload-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "X-User-Id": session.user.id,
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
            ? `${WORKER_URL}/api/v1/images/${data.imageId}`
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
