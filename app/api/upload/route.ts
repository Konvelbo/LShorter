import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { uploadToBunny, isBunnyConfigured, getOptimizedBunnyOgUrl } from "@/lib/bunny";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let base64Data = "";
    let fileBuffer: Buffer | null = null;
    let mimeType = "image/jpeg";
    let uploadFolder = "banners";
    let originalName = "upload";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      uploadFolder = body.folder ? body.folder.replace(/^lshorter\/?/, "") : uploadFolder;
      base64Data = body.data || body.file || "";

      if (base64Data) {
        const commaIdx = base64Data.indexOf(",");
        if (commaIdx !== -1) {
          const meta = base64Data.substring(0, commaIdx);
          const rawBase64 = base64Data.substring(commaIdx + 1);
          const mimeMatch = meta.match(/data:([^;,]+)/);
          if (mimeMatch) {
            mimeType = mimeMatch[1];
          }
          fileBuffer = Buffer.from(rawBase64, "base64");
        } else {
          fileBuffer = Buffer.from(base64Data, "base64");
        }
      }
    } else {
      const formData = await req.formData();
      uploadFolder = (formData.get("folder") as string) || uploadFolder;
      uploadFolder = uploadFolder.replace(/^lshorter\/?/, "");
      const file = formData.get("file") as File | null;
      if (file) {
        mimeType = file.type || "image/jpeg";
        originalName = file.name ? file.name.replace(/[^a-zA-Z0-9._-]/g, "") : "upload";
        const bytes = await file.arrayBuffer();
        fileBuffer = Buffer.from(bytes);
        base64Data = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
      }
    }

    if (!fileBuffer && !base64Data) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier image reçu" },
        { status: 400 }
      );
    }

    // Determine extension and clean filename
    const ext = (mimeType.split("/")[1] || "jpg").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const safeExt = ext === "jpeg" ? "jpg" : ext;
    const randomSlug = Math.random().toString(36).substring(2, 7);
    const fileName = `upload_${Date.now()}_${randomSlug}.${safeExt}`;

    // 1. Primary Tier: Bunny.net Storage & CDN (Ultra-fast, Pay-as-you-go, 120+ Edge PoPs)
    if (isBunnyConfigured() && (fileBuffer || base64Data)) {
      try {
        const bunnyResult = await uploadToBunny(fileBuffer || base64Data, {
          folder: uploadFolder,
          filename: fileName,
          contentType: mimeType,
        });

        if (bunnyResult.success && bunnyResult.url) {
          const isBanner = uploadFolder.includes("banner");
          const finalUrl = isBanner
            ? getOptimizedBunnyOgUrl(bunnyResult.url)
            : bunnyResult.url;

          return NextResponse.json({
            success: true,
            provider: "bunny",
            url: finalUrl,
            cdnUrl: bunnyResult.cdnUrl || finalUrl,
            filename: bunnyResult.filename || fileName,
            storagePath: bunnyResult.storagePath,
          });
        } else {
          console.warn("[Upload API] Bunny.net returned non-success, using local fallback:", bunnyResult.error);
        }
      } catch (bunnyErr) {
        console.warn("[Upload API] Bunny.net upload exception, using local fallback:", bunnyErr);
      }
    }

    // 2. Localhost & Server Storage fallback (Save directly to public/uploads directory)
    if (fileBuffer) {
      try {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, fileBuffer);

        return NextResponse.json({
          success: true,
          provider: "local",
          url: `/api/images/${fileName}`,
          cdnUrl: `/api/images/${fileName}`,
          imageId: fileName,
        });
      } catch (fsErr: any) {
        console.error("[Upload API Local FS Error]:", fsErr);
      }
    }

    // 3. Last fallback: return the base64 data URL
    if (base64Data) {
      return NextResponse.json({
        success: true,
        provider: "base64",
        url: base64Data,
        cdnUrl: base64Data,
      });
    }

    return NextResponse.json(
      { success: false, error: "Échec du traitement de l'image" },
      { status: 500 }
    );
  } catch (err: any) {
    console.error("[Upload API Proxy Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Erreur serveur upload" },
      { status: 500 }
    );
  }
}
