import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import dns from "node:dns/promises";
import net from "node:net";

export const revalidate = 86400;

function isPrivateIpAddress(ip: string): boolean {
  const cleanIp = ip.replace(/^::ffff:/i, "");
  if (net.isIPv4(cleanIp)) {
    const parts = cleanIp.split(".").map(Number);
    if (parts.length !== 4) return true;
    const [a, b] = parts;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    return (
      lower === "::1" ||
      lower === "::" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe8") ||
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb") ||
      lower.startsWith("::ffff:")
    );
  }
  return true;
}

function isSafePublicHttpsImageUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;
    if (parsed.username || parsed.password) return false;
    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (!host || !host.includes(".")) return false;
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host === "metadata.google.internal"
    ) {
      return false;
    }
    if (host.includes(":") || net.isIP(host)) {
      return !isPrivateIpAddress(host);
    }
    return true;
  } catch {
    return false;
  }
}

async function fetchSafeRemoteImageDataUri(rawUrl: string): Promise<string | null> {
  if (!isSafePublicHttpsImageUrl(rawUrl)) return null;
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    const resolved = await dns.lookup(host, { all: true }).catch(() => []);
    if (!resolved.length || resolved.some((entry) => isPrivateIpAddress(entry.address))) {
      return null;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(rawUrl, {
        method: "GET",
        redirect: "error",
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      if (!["image/jpeg", "image/png", "image/gif"].includes(contentType)) {
        return null;
      }
      const declaredLen = Number(res.headers.get("content-length") || 0);
      if (declaredLen > 3 * 1024 * 1024) return null;
      const arrBuf = await res.arrayBuffer();
      if (arrBuf.byteLength === 0 || arrBuf.byteLength > 3 * 1024 * 1024) return null;
      return `data:${contentType};base64,${Buffer.from(arrBuf).toString("base64")}`;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

async function toBufferedPngResponse(
  imgRes: ImageResponse,
  extraHeaders: Record<string, string>
): Promise<Response> {
  const buf = await imgRes.arrayBuffer();
  return new Response(buf, {
    status: 200,
    headers: {
      ...extraHeaders,
      "Content-Type": "image/png",
      "Content-Length": buf.byteLength.toString(),
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = (searchParams.get("title") || searchParams.get("amp;title") || "LShorter").trim();
    const rawDesc = (searchParams.get("desc") || searchParams.get("amp;desc") || "").trim();
    const desc = rawDesc || "Lien raccourci et sécurisé via l'infrastructure Edge LShorter.";
    const slug = (searchParams.get("slug") || searchParams.get("amp;slug") || "").trim();
    const card = searchParams.get("card") || searchParams.get("amp;card") || "";
    const mode = searchParams.get("mode") || searchParams.get("amp;mode") || "";
    const isCompact = card === "summary" || mode === "compact";
    const img = (
      searchParams.get("img") ||
      searchParams.get("amp;img") ||
      searchParams.get("image") ||
      searchParams.get("amp;image") ||
      ""
    ).trim();

    const responseHeaders = {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cross-Origin-Resource-Policy": "cross-origin",
    };

    // If requesting default brand / hero OG image or no specific custom link slug, serve the official launch banner
    const isDefaultBrand =
      (!slug && (!title || title === "LShorter") && (!rawDesc || rawDesc.includes("Edge URL Shortener") || rawDesc.includes("Next-gen Edge"))) ||
      searchParams.get("hero") === "true";

    if (isDefaultBrand && !img) {
      try {
        const fs = await import("fs/promises");
        const path = await import("path");
        const launchPath = path.join(process.cwd(), "public", "lshorter-launch-banner-2026.png");
        const fallbackPath = path.join(process.cwd(), "public", "og-image.png");
        let heroBuf: Buffer;
        try {
          heroBuf = await fs.readFile(launchPath);
        } catch {
          heroBuf = await fs.readFile(fallbackPath);
        }
        return new Response(new Uint8Array(heroBuf), {
          status: 200,
          headers: responseHeaders,
        });
      } catch (err) {
        console.warn("[/api/og] Fallback to dynamic renderer:", err);
      }
    }

    if (img) {
      const safeImgDataUri = await fetchSafeRemoteImageDataUri(img);
      if (safeImgDataUri) {
        return await toBufferedPngResponse(
          new ImageResponse(
            (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  backgroundColor: "#f4f7ff",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={safeImgDataUri}
                  alt={title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            ),
            {
              width: isCompact ? 600 : 1200,
              height: isCompact ? 600 : 630,
              headers: responseHeaders,
            }
          ),
          responseHeaders
        );
      }
    }

    if (isCompact) {
      const displayTitle = title.length > 68 ? `${title.substring(0, 65)}...` : title;
      const displayDesc = desc.length > 155 ? `${desc.substring(0, 152)}...` : desc;
      return await toBufferedPngResponse(
        new ImageResponse(
        (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              background: "linear-gradient(135deg, #f8faff 0%, #eaf1ff 100%)",
              fontFamily: "sans-serif",
              position: "relative",
              overflow: "hidden",
              padding: "44px",
              boxSizing: "border-box",
            }}
          >
            {/* Soft Blue Accent Glow */}
            <div
              style={{
                position: "absolute",
                top: -90,
                right: -90,
                width: 300,
                height: 300,
                borderRadius: "50%",
                backgroundColor: "rgba(37, 99, 235, 0.14)",
              }}
            />

            {/* Top Brand Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: "#2563EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    fontWeight: 900,
                    color: "white",
                  }}
                >
                  LS
                </div>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#09090b" }}>
                  LShorter
                </span>
              </div>
              {slug ? (
                <div
                  style={{
                    display: "flex",
                    padding: "6px 14px",
                    borderRadius: 20,
                    backgroundColor: "#2563EB",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#ffffff",
                  }}
                >
                  {`/${slug}`}
                </div>
              ) : null}
            </div>

            {/* Title & Description */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
              <div
                style={{
                  fontSize: displayTitle.length > 36 ? 34 : 42,
                  fontWeight: 900,
                  color: "#09090b",
                  lineHeight: 1.18,
                  display: "flex",
                }}
              >
                {displayTitle}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 21,
                  color: "#3f3f46",
                  lineHeight: 1.45,
                  fontWeight: 500,
                }}
              >
                {displayDesc}
              </div>
            </div>

            {/* Bottom Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 18,
                borderTop: "1px solid rgba(9, 9, 11, 0.1)",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 800, color: "#2563EB", letterSpacing: 0.4 }}>
                {"< 2 ms · EDGE ROUTING"}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#52525b" }}>
                lsho.cc
              </span>
            </div>

            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 6,
                backgroundColor: "#2563EB",
              }}
            />
          </div>
        ),
        {
          width: 600,
          height: 600,
          headers: responseHeaders,
        }
        ),
        responseHeaders
      );
    }

    const displayTitle = title.length > 78 ? `${title.substring(0, 75)}...` : title;
    const displayDesc = desc.length > 160 ? `${desc.substring(0, 157)}...` : desc;

    return await toBufferedPngResponse(
      new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #f8faff 0%, #e8f0ff 100%)",
            fontFamily: "sans-serif",
            position: "relative",
            overflow: "hidden",
            padding: "56px 64px 52px",
            boxSizing: "border-box",
          }}
        >
          {/* Soft Decorative Glows */}
          <div
            style={{
              position: "absolute",
              top: -140,
              right: -100,
              width: 480,
              height: 480,
              borderRadius: "50%",
              backgroundColor: "rgba(37, 99, 235, 0.12)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -160,
              left: -80,
              width: 380,
              height: 380,
              borderRadius: "50%",
              backgroundColor: "rgba(37, 99, 235, 0.08)",
            }}
          />

          {/* Top Branding Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: "#2563EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 900,
                  color: "white",
                }}
              >
                LS
              </div>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#09090b",
                }}
              >
                LShorter
              </span>
              <div
                style={{
                  display: "flex",
                  marginLeft: 8,
                  padding: "6px 14px",
                  borderRadius: 20,
                  backgroundColor: "rgba(37, 99, 235, 0.12)",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#1d4ed8",
                }}
              >
                {"< 2 ms · EDGE"}
              </div>
            </div>

            {slug ? (
              <div
                style={{
                  display: "flex",
                  padding: "10px 22px",
                  borderRadius: 999,
                  backgroundColor: "#2563EB",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                {`lsho.cc/${slug}`}
              </div>
            ) : null}
          </div>

          {/* Main Card Content (Title + Full User Description) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              maxWidth: 1040,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: displayTitle.length > 44 ? 48 : 58,
                fontWeight: 900,
                color: "#09090b",
                lineHeight: 1.12,
              }}
            >
              {displayTitle}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 26,
                color: "#3f3f46",
                lineHeight: 1.45,
                fontWeight: 500,
                maxWidth: 980,
              }}
            >
              {displayDesc}
            </div>
          </div>

          {/* Badges Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 22,
              borderTop: "1px solid rgba(9, 9, 11, 0.1)",
            }}
          >
            <div style={{ display: "flex", gap: 14 }}>
              <div
                style={{
                  display: "flex",
                  padding: "8px 16px",
                  borderRadius: 10,
                  backgroundColor: "rgba(37, 99, 235, 0.12)",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#1d4ed8",
                }}
              >
                Edge Verified Link
              </div>
              <div
                style={{
                  display: "flex",
                  padding: "8px 16px",
                  borderRadius: 10,
                  backgroundColor: "rgba(9, 9, 11, 0.06)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#3f3f46",
                }}
              >
                Routage intelligent &amp; Analytics temps réel
              </div>
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#52525b" }}>
              lsho.cc
            </span>
          </div>

          {/* Bottom Accent Line */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 6,
              backgroundColor: "#2563EB",
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: responseHeaders,
      }
      ),
      responseHeaders
    );
  } catch (err) {
    console.error("[app/api/og] Edge banner generation error:", err);
    // Minimal fallback banner to guarantee 200 OK image for Twitterbot / WhatsApp
    const fallbackHeaders = {
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    };
    return await toBufferedPngResponse(
      new ImageResponse(
        (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f4f7ff",
              color: "#09090b",
              fontFamily: "sans-serif",
            }}
          >
            <div style={{ display: "flex", fontSize: 54, fontWeight: 900, color: "#2563EB" }}>
              LShorter
            </div>
            <div style={{ display: "flex", fontSize: 24, marginTop: 16, color: "#3f3f46" }}>
              Vos liens à la vitesse de l&apos;Edge — lsho.cc
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
          headers: fallbackHeaders,
        }
      ),
      fallbackHeaders
    );
  }
}

export async function HEAD(req: NextRequest) {
  const res = await GET(req);
  return new Response(null, {
    status: res.status,
    headers: res.headers,
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  });
}
