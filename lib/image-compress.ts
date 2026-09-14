/**
 * Client-Side Image Compressor
 * ─────────────────────────────────────────────────────────────────────────────
 * Resizes and compresses images in the browser before sending to CDN / APIs.
 * Uses center-crop to always produce exactly maxWidth×maxHeight (e.g. 1200×630)
 * which is required for Twitter summary_large_image OG cards.
 */

export async function compressImageFile(
  fileOrBase64: File | Blob | string,
  maxWidth = 1200,
  maxHeight = 630,
  quality = 0.82
): Promise<File | string> {
  if (typeof window === "undefined") {
    return fileOrBase64 as any;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = maxWidth;
          canvas.height = maxHeight;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            return resolve(fileOrBase64 as any);
          }

          // Center-crop: scale the source image so it FILLS the target canvas,
          // then draw only the centered portion (cover behaviour, like CSS object-fit: cover).
          const srcRatio = img.width / img.height;
          const dstRatio = maxWidth / maxHeight;

          let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;

          if (srcRatio > dstRatio) {
            // Source is wider than target ratio → crop sides
            srcW = Math.round(img.height * dstRatio);
            srcX = Math.round((img.width - srcW) / 2);
          } else {
            // Source is taller than target ratio → crop top/bottom
            srcH = Math.round(img.width / dstRatio);
            srcY = Math.round((img.height - srcH) / 2);
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, maxWidth, maxHeight);

          // If input was a File/Blob, return a compressed File
          if (typeof fileOrBase64 !== "string") {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  return resolve(fileOrBase64 as any);
                }
                const fileName =
                  fileOrBase64 instanceof File
                    ? fileOrBase64.name.replace(/\.[^/.]+$/, ".jpg")
                    : "og-banner.jpg";
                const compressedFile = new File([blob], fileName, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              },
              "image/jpeg",
              quality
            );
          } else {
            // Return compressed data URL
            const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
            resolve(compressedDataUrl);
          }
        } catch {
          resolve(fileOrBase64 as any);
        }
      };

      img.onerror = () => {
        resolve(fileOrBase64 as any);
      };

      if (typeof fileOrBase64 === "string") {
        img.src = fileOrBase64;
      } else {
        img.src = URL.createObjectURL(fileOrBase64);
      }
    } catch {
      resolve(fileOrBase64 as any);
    }
  });
}

