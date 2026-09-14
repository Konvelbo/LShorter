import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "LShorter";
  const desc = searchParams.get("desc") || "Next-gen Edge URL Shortener & Smart Routing";
  const slug = searchParams.get("slug") || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "linear-gradient(135deg, #09090b 0%, #0f0f14 50%, #0a0d1a 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,102,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,102,0,0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,102,0,0.18) 0%, transparent 70%)",
          }}
        />
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
              background: "#ff6600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 900,
              color: "white",
              letterSpacing: "-1px",
            }}
          >
            LS
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: "-0.5px" }}>
            LShorter
          </span>
          <div
            style={{
              marginLeft: 8,
              padding: "3px 10px",
              borderRadius: 20,
              border: "1px solid rgba(255,102,0,0.4)",
              background: "rgba(255,102,0,0.1)",
              fontSize: 11,
              fontWeight: 700,
              color: "#ff6600",
              letterSpacing: 1,
            }}
          >
            EDGE SAAS
          </div>
        </div>
        {slug && (
          <div
            style={{
              position: "absolute",
              top: 56,
              right: 56,
              padding: "6px 16px",
              borderRadius: 24,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            lsho.cc/{slug}
          </div>
        )}
        <div style={{ padding: "0 56px 56px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: title.length > 40 ? 44 : 56, fontWeight: 900, color: "white", lineHeight: 1.1, letterSpacing: "-1.5px", maxWidth: 900 }}>
            {title}
          </div>
          <div style={{ fontSize: 22, color: "rgba(255,255,255,0.5)", lineHeight: 1.4, maxWidth: 780, fontWeight: 400 }}>
            {desc.length > 90 ? desc.substring(0, 87) + "..." : desc}
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
            {["Edge Network", "120+ PoPs", "Smart Routing"].map((stat) => (
              <div
                key={stat}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  background: "rgba(255,102,0,0.08)",
                  border: "1px solid rgba(255,102,0,0.2)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {stat}
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #ff6600, #ff9900, #ff6600)",
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
