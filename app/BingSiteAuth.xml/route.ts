import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BING_TOKEN_RE = /^[a-zA-Z0-9_-]{8,64}$/;

function extractBingToken(val?: string): string {
  if (!val) return "";
  const trimmed = val.trim();
  const contentMatch = trimmed.match(/content=["']([^"']+)["']/i);
  if (contentMatch?.[1]) return contentMatch[1].trim();
  return trimmed.replace(/<[^>]+>/g, "").trim();
}

export async function GET() {
  const rawToken =
    process.env.NEXT_PUBLIC_BING_VERIFICATION ||
    process.env.BING_SITE_VERIFICATION ||
    "";

  const cleanToken = extractBingToken(rawToken);

  if (!cleanToken || !BING_TOKEN_RE.test(cleanToken)) {
    return new NextResponse("Bing verification code not configured or invalid", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const xml = `<?xml version="1.0"?>
<users>
  <user>${cleanToken}</user>
</users>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
