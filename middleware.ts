import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = Boolean(req.auth);
  const user = req.auth?.user as any;
  const hasCompletedOnboarding = user?.hasCompletedOnboarding;

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

  // 1. Protect Dashboard & Onboarding Routes from unauthenticated users
  const isProtectedPath =
    pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");

  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirect authenticated users who haven't completed onboarding away from dashboard
  if (isAuthenticated && hasCompletedOnboarding === false && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin));
  }

  // 3. Redirect authenticated users who have already completed onboarding away from /onboarding
  if (isAuthenticated && hasCompletedOnboarding === true && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  // 4. Redirect already authenticated users away from /login or /register
  const isAuthPath = pathname === "/login" || pathname === "/register";
  if (isAuthPath && isAuthenticated) {
    if (hasCompletedOnboarding === false) {
      return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin));
    }
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return response;
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/login",
    "/register",
  ],
};
