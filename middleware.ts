// middleware.ts
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { authLimiter, apiLimiter, publicLimiter, getClientIp } from "@/lib/ratelimit";

// Routes that require authentication
const protectedPaths = [
  "/platform",
  "/dashboard",
  "/appointments",
  "/clients",
  "/services",
  "/stylists",
  "/shop",
  "/orders",
  "/expenses",
  "/payroll",
  "/profit-loss",
  "/reports",
  "/settings",
  "/onboarding",
];

// Salon dashboard paths (everything except /platform and /onboarding)
const salonPaths = [
  "/dashboard",
  "/appointments",
  "/clients",
  "/services",
  "/stylists",
  "/shop",
  "/orders",
  "/expenses",
  "/payroll",
  "/profit-loss",
  "/reports",
  "/settings",
];

// Routes only for unauthenticated users
const authPaths = ["/login", "/signup", "/forgot-password"];

function selectLimiter(pathname: string) {
  // Auth endpoints — strictest limit
  if (
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/auth"
  ) {
    return authLimiter;
  }
  // Portal auth + public endpoints
  if (
    pathname.startsWith("/api/portal/") ||
    pathname.startsWith("/api/public/")
  ) {
    return publicLimiter;
  }
  // Everything else under /api
  return apiLimiter;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Rate limiting for API routes ---
  if (pathname.startsWith("/api/")) {
    const limiter = selectLimiter(pathname);

    if (limiter) {
      const ip = getClientIp(request);
      const { success, limit, remaining, reset } = await limiter.limit(ip);

      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
            },
          }
        );
      }

      // Attach rate limit headers to successful responses
      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Limit", limit.toString());
      response.headers.set("X-RateLimit-Remaining", remaining.toString());
      response.headers.set("X-RateLimit-Reset", reset.toString());
      return response;
    }

    // No limiter (Upstash not configured) — pass through
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      console.warn("Rate limiting disabled: UPSTASH credentials not configured");
    }
    return NextResponse.next();
  }

  // --- Page-level auth (existing logic) ---
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if path matches protected routes
  const isProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // Check if path matches auth routes
  const isAuthPath = authPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // Redirect unauthenticated users to login
  if (isProtectedPath && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPath && token) {
    // SUPER_ADMIN goes to platform dashboard
    if (token.role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/platform", request.url));
    }
    if (token.onboardingComplete === false) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // --- SUPER_ADMIN routing ---
  if (token && token.role === "SUPER_ADMIN") {
    // If SUPER_ADMIN tries to access salon dashboard, redirect to platform
    const isSalonPath = salonPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
    if (isSalonPath) {
      return NextResponse.redirect(new URL("/platform", request.url));
    }
  }

  // Block non-SUPER_ADMIN from /platform routes
  if (token && token.role !== "SUPER_ADMIN" && pathname.startsWith("/platform")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect to onboarding if not complete (skip for SUPER_ADMIN)
  if (
    isProtectedPath &&
    token &&
    token.role !== "SUPER_ADMIN" &&
    token.onboardingComplete === false
  ) {
    const isOnboardingPath = pathname === "/onboarding" || pathname.startsWith("/onboarding/");
    if (!isOnboardingPath) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // Note: Granular permission checks happen in API routes and sidebar filtering.
  // Middleware only enforces authentication.

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon, manifest, icons, sw.js
     * - public booking pages (/book/*)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|manifest\\.json|sw\\.js|icons|book).*)",
  ],
};
