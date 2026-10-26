import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || searchParams.get("amp;title") || "LShorter";
    const desc = searchParams.get("desc") || searchParams.get("amp;desc") || "Next-gen Edge URL Shortener & Smart Routing";
    const slug = searchParams.get("slug") || searchParams.get("amp;slug") || "";
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
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    };

    if (img && (img.startsWith("http://") || img.startsWith("https://"))) {
      return new ImageResponse(
        (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              backgroundColor: "#09090b",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
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
          width: isCompact ? 400 : 1200,
          height: isCompact ? 400 : 630,
          headers: responseHeaders,
        }
      );
    }

    if (isCompact) {
      return new ImageResponse(
        (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              backgroundColor: "#09090b",
              fontFamily: "sans-serif",
              position: "relative",
              overflow: "hidden",
              padding: "36px",
              boxSizing: "border-box",
            }}
          >
            {/* Orange Glow */}
            <div
              style={{
                position: "absolute",
                top: -60,
                right: -60,
                width: 240,
                height: 240,
                borderRadius: "50%",
                backgroundColor: "rgba(255, 102, 0, 0.18)",
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
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: "#ff6600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 900,
                    color: "white",
                  }}
                >
                  LS
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color: "white" }}>
                  LShorter
                </span>
              </div>
              {slug ? (
                <div
                  style={{
                    display: "flex",
                    padding: "4px 10px",
                    borderRadius: 14,
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                >
                  {slug}
                </div>
              ) : null}
            </div>

            {/* Title & Desc */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              <div
                style={{
                  fontSize: title.length > 30 ? 24 : 28,
                  fontWeight: 800,
                  color: "white",
                  lineHeight: 1.25,
                  display: "-webkit-box",
                  overflow: "hidden",
                }}
              >
                {title.length > 55 ? `${title.substring(0, 52)}...` : title}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "rgba(255, 255, 255, 0.6)",
                  lineHeight: 1.35,
                }}
              >
                {desc.length > 75 ? `${desc.substring(0, 72)}...` : desc}
              </div>
            </div>

            {/* Bottom Footer Accent */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 14,
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "#ff8533", letterSpacing: 0.5 }}>
                EDGE VERIFIED
              </span>
              <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.4)" }}>
                lsho.cc
              </span>
            </div>

            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                backgroundColor: "#ff6600",
              }}
            />
          </div>
        ),
        {
          width: 400,
          height: 400,
          headers: responseHeaders,
        }
      );
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            backgroundColor: "#09090b",
            fontFamily: "sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle Orange Glow Circle */}
          <div
            style={{
              position: "absolute",
              top: -100,
              right: -50,
              width: 440,
              height: 440,
              borderRadius: "50%",
              backgroundColor: "rgba(255, 102, 0, 0.16)",
            }}
          />

          {/* Top Branding Bar */}
          <div
            style={{
              position: "absolute",
              top: 48,
              left: 56,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "#ff6600",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 900,
                color: "white",
              }}
            >
              LS
            </div>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "white",
              }}
            >
              LShorter
            </span>
            <div
              style={{
                display: "flex",
                marginLeft: 8,
                padding: "4px 10px",
                borderRadius: 20,
                backgroundColor: "rgba(255, 102, 0, 0.12)",
                fontSize: 11,
                fontWeight: 700,
                color: "#ff6600",
              }}
            >
              EDGE CLOUD
            </div>
          </div>

          {/* Optional Slug Badge in Top Right */}
          {slug ? (
            <div
              style={{
                position: "absolute",
                top: 52,
                right: 56,
                display: "flex",
                padding: "6px 16px",
                borderRadius: 20,
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                fontSize: 13,
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.7)",
              }}
            >
              {`lsho.cc/${slug}`}
            </div>
          ) : null}

          {/* Main Card Content */}
          <div
            style={{
              padding: "0 56px 56px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: title.length > 40 ? 44 : 56,
                fontWeight: 900,
                color: "white",
                lineHeight: 1.15,
                maxWidth: 950,
              }}
            >
              {title}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "rgba(255, 255, 255, 0.6)",
                lineHeight: 1.4,
                maxWidth: 820,
              }}
            >
              {desc.length > 100 ? `${desc.substring(0, 97)}...` : desc}
            </div>

            {/* Badges Footer */}
            <div
              style={{
                display: "flex",
                gap: 14,
                marginTop: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  padding: "6px 14px",
                  borderRadius: 8,
                  backgroundColor: "rgba(255, 102, 0, 0.1)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#ff8533",
                }}
              >
                Edge Verified Link
              </div>
              <div
                style={{
                  display: "flex",
                  padding: "6px 14px",
                  borderRadius: 8,
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.65)",
                }}
              >
                120+ Edge Locations
              </div>
            </div>
          </div>

          {/* Bottom Accent Line */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 4,
              backgroundColor: "#ff6600",
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: responseHeaders,
      }
    );
  } catch (err) {
    console.error("[app/api/og] Edge banner generation error:", err);
    // Minimal fallback banner to guarantee 200 OK image for Twitterbot / WhatsApp
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#09090b",
            color: "white",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ display: "flex", fontSize: 48, fontWeight: 900, color: "#ff6600" }}>
            LShorter
          </div>
          <div style={{ display: "flex", fontSize: 24, marginTop: 16, color: "rgba(255,255,255,0.7)" }}>
            Next-gen Edge URL Shortener & Smart Routing
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
