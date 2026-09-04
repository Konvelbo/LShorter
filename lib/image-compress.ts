/**
 * Client-Side Image Compressor
 * ─────────────────────────────────────────────────────────────────────────────
 * Resizes and compresses images in the browser before sending to CDN / APIs.
 * Prevents HTTP 413 Payload Too Large and reduces upload time by >90%.
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
          let width = img.width;
          let height = img.height;

          // Scale down proportionally
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            return resolve(fileOrBase64 as any);
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

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
