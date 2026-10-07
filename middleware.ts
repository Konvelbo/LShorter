import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

const authMiddleware = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth as any;
  const isAuthenticated = Boolean(session);
  const hasCompletedOnboarding = Boolean(
    session?.user?.hasCompletedOnboarding ?? session?.hasCompletedOnboarding
  );

  // Security Headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // 1. Protect Dashboard & Onboarding Routes
  const isProtectedPath =
    pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");

  if (isProtectedPath && !isAuthenticated) {
    const targetPath = pathname.startsWith("/onboarding") ? "/register" : "/login";
    const redirectUrl = new URL(targetPath, req.nextUrl.origin);
    if (pathname.startsWith("/dashboard")) {
      redirectUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Redirect authenticated users who haven't completed onboarding away from dashboard
  if (isAuthenticated && hasCompletedOnboarding === false && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin));
  }

  // 3. Redirect authenticated users who have already completed onboarding away from /onboarding
  if (isAuthenticated && hasCompletedOnboarding === true && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  // 4. Redirect already authenticated users away from /login or /register ONLY if onboarding is already completed
  const isAuthPath = pathname === "/login" || pathname === "/register";
  if (isAuthPath && isAuthenticated && hasCompletedOnboarding === true) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return response;
});

export default function middleware(req: NextRequest) {
  // DEMO-START: Allow temporary demo mode to access dashboard without authentication
  const isDemoMode = req.cookies.get("lshorter_demo_mode")?.value === "true";
  if (isDemoMode && req.nextUrl.pathname.startsWith("/dashboard")) {
    const response = NextResponse.next();
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    return response;
  }
  // DEMO-END

  return (authMiddleware as any)(req);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/login",
    "/register",
  ],
};
