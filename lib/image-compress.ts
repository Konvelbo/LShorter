/**
 * Client-Side Image Compressor & Social Banner Cropper
 * ─────────────────────────────────────────────────────────────────────────────
 * Resizes, crops, and compresses images in the browser before sending to CDN / APIs.
 * Supports react-easy-crop pixel coordinates to produce exact 1200×630 (Large)
 * or 600×600 (Compact) dimensions required by Twitter/X and LinkedIn.
 */

export interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Crops an image based on react-easy-crop pixel coordinates and compresses
 * the output using Canvas into high-definition, lightweight JPEG.
 */
export async function cropAndCompressImage(
  imageSrc: string | File | Blob,
  croppedAreaPixels: CroppedAreaPixels,
  targetWidth: number = 1200,
  targetHeight: number = 630,
  quality: number = 0.88
): Promise<{ file: File; dataUrl: string }> {
  if (typeof window === "undefined") {
    throw new Error("cropAndCompressImage can only run in the browser");
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    let objectUrl: string | null = null;

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Could not acquire 2d canvas rendering context");
        }

        // High quality downscaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw the exact cropped slice onto the target canvas
        ctx.drawImage(
          img,
          Math.max(0, Math.round(croppedAreaPixels.x)),
          Math.max(0, Math.round(croppedAreaPixels.y)),
          Math.max(1, Math.round(croppedAreaPixels.width)),
          Math.max(1, Math.round(croppedAreaPixels.height)),
          0,
          0,
          targetWidth,
          targetHeight
        );

        const dataUrl = canvas.toDataURL("image/jpeg", quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              const fallbackFile = new File([], `social-banner-${targetWidth}x${targetHeight}.jpg`, {
                type: "image/jpeg",
              });
              return resolve({ file: fallbackFile, dataUrl });
            }
            const file = new File(
              [blob],
              `social-banner-${targetWidth}x${targetHeight}.jpg`,
              {
                type: "image/jpeg",
                lastModified: Date.now(),
              }
            );
            resolve({ file, dataUrl });
          },
          "image/jpeg",
          quality
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load source image for cropping"));
    };

    if (typeof imageSrc === "string") {
      img.src = imageSrc;
    } else {
      objectUrl = URL.createObjectURL(imageSrc);
      img.src = objectUrl;
    }
  });
}

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

