import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { uploadToBunny, isBunnyConfigured, getOptimizedBunnyOgUrl } from "@/lib/bunny";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let base64Data = "";
    let fileBuffer: Buffer | null = null;
    let fileName = `banner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
    let mimeType = "image/jpeg";

    let uploadFolder = "banners";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      uploadFolder = body.folder ? body.folder.replace(/^lshorter\/?/, "") : uploadFolder;
      base64Data = body.data || body.file || "";
      if (base64Data.startsWith("data:")) {
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          fileBuffer = Buffer.from(matches[2], "base64");
          const ext = mimeType.split("/")[1] || "jpg";
          fileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        }
      }
    } else {
      const formData = await req.formData();
      uploadFolder = (formData.get("folder") as string) || uploadFolder;
      uploadFolder = uploadFolder.replace(/^lshorter\/?/, "");
      const file = formData.get("file") as File | null;
      if (file) {
        fileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
        mimeType = file.type || "image/jpeg";
        const bytes = await file.arrayBuffer();
        fileBuffer = Buffer.from(bytes);
        base64Data = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
      }
    }

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
            filename: bunnyResult.filename,
            storagePath: bunnyResult.storagePath,
          });
        }
      } catch (bunnyErr) {
        console.warn("[Upload API] Bunny.net upload error, trying fallbacks:", bunnyErr);
      }
    }


    // 3. Localhost fallback (when remote CDN credentials are being configured): Save directly to public/uploads directory
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

    // 4. Last fallback: return the base64 data URL
    if (base64Data) {
      return NextResponse.json({
        success: true,
        provider: "base64",
        url: base64Data,
        cdnUrl: base64Data,
      });
    }

    return NextResponse.json(
      { success: false, error: "Aucun fichier image reçu" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[Upload API Proxy Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Erreur serveur upload" },
      { status: 500 }
    );
  }
}
