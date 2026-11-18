import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GOOGLE_FILE_RE = /^google([a-zA-Z0-9_-]{4,64})\.html$/;

function extractToken(val?: string): string {
  if (!val) return "";
  const trimmed = val.trim();
  const contentMatch = trimmed.match(/content=["']([^"']+)["']/i);
  if (contentMatch?.[1]) return contentMatch[1].trim();
  return trimmed.replace(/<[^>]+>/g, "").trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file") || "";

  // Strictly validate file parameter syntax against google<hash>.html
  const match = file.match(GOOGLE_FILE_RE);
  if (!match) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const requestedHash = match[1];

  // Collect all configured verification tokens from environment
  const candidateTokens = [
    process.env.GOOGLE_SITE_VERIFICATION,
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  ]
    .map(extractToken)
    .filter((tok) => tok.length >= 4);

  if (candidateTokens.length === 0) {
    return new NextResponse("Verification token not configured", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Exact match checking
  const isAuthorized = candidateTokens.some((token) => {
    // Exact token match or filename match
    return (
      token === requestedHash ||
      token === `google${requestedHash}.html` ||
      token === `google${requestedHash}`
    );
  });

  if (!isAuthorized) {
    return new NextResponse("Unauthorized verification request", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Safe static string interpolation using strictly sanitized hash
  return new NextResponse(`google-site-verification: google${requestedHash}.html`, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
