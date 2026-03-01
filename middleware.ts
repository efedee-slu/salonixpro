// middleware.ts
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { authLimiter, apiLimiter, publicLimiter, getClientIp } from "@/lib/ratelimit";

// CORS: only allow requests from salonixpro.com origins
const ALLOWED_ORIGINS = new Set([
  "https://salonixpro.com",
  "https://www.salonixpro.com",
]);

function setCorsHeaders(response: NextResponse, origin: string | null) {
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Max-Age", "86400");
    response.headers.set("Vary", "Origin");
  }
}

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
  "/reviews",
  "/gallery",
  "/product-costing",
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
  "/reviews",
  "/gallery",
  "/product-costing",
];

// Routes only for unauthenticated users
const authPaths = ["/login", "/signup", "/forgot-password", "/reset-password"];

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
  const origin = request.headers.get("origin");

  // --- CORS preflight handling for API routes ---
  if (pathname.startsWith("/api/") && request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    setCorsHeaders(response, origin);
    return response;
  }

  // --- Rate limiting for API routes ---
  // Skip rate limiting for internal dashboard API calls (authenticated via session)
  const skipRateLimit =
    pathname.startsWith("/api/dashboard") ||
    pathname.startsWith("/api/me") ||
    pathname.startsWith("/api/appointments") ||
    pathname.startsWith("/api/clients") ||
    pathname.startsWith("/api/services") ||
    pathname.startsWith("/api/stylists") ||
    pathname.startsWith("/api/settings") ||
    pathname.startsWith("/api/reviews") ||
    pathname.startsWith("/api/orders") ||
    pathname.startsWith("/api/products") ||
    pathname.startsWith("/api/expenses") ||
    pathname.startsWith("/api/notifications") ||
    pathname.startsWith("/api/reports") ||
    pathname.startsWith("/api/profit-loss") ||
    pathname.startsWith("/api/billing") ||
    pathname.startsWith("/api/product-costing") ||
    pathname.startsWith("/api/gallery") ||
    pathname.startsWith("/api/recurring-series") ||
    pathname.startsWith("/api/waitlist") ||
    pathname.startsWith("/api/public/waitlist");

  if (pathname.startsWith("/api/") && !skipRateLimit) {
    const limiter = selectLimiter(pathname);

    if (limiter) {
      try {
        const ip = getClientIp(request);
        const { success, limit, remaining, reset } = await limiter.limit(ip);

        if (!success) {
          const rateLimitResponse = NextResponse.json(
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
          setCorsHeaders(rateLimitResponse, origin);
          return rateLimitResponse;
        }

        // Attach rate limit headers to successful responses
        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Limit", limit.toString());
        response.headers.set("X-RateLimit-Remaining", remaining.toString());
        response.headers.set("X-RateLimit-Reset", reset.toString());
        setCorsHeaders(response, origin);
        return response;
      } catch (rateLimitError) {
        // If rate limiter fails (e.g. Redis connection issue), allow the request through
        console.error("Rate limiter error, allowing request:", rateLimitError);
        const fallbackResponse = NextResponse.next();
        setCorsHeaders(fallbackResponse, origin);
        return fallbackResponse;
      }
    }

    // No limiter (Upstash not configured) — pass through
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      console.warn("Rate limiting disabled: UPSTASH credentials not configured");
    }
    const noLimiterResponse = NextResponse.next();
    setCorsHeaders(noLimiterResponse, origin);
    return noLimiterResponse;
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
