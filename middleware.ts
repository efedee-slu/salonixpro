// middleware.ts
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Role hierarchy levels
const ROLE_LEVELS: Record<string, number> = {
  OWNER: 4,
  MANAGER: 3,
  STYLIST: 2,
  ASSISTANT: 1,
};

// Routes that require authentication
const protectedPaths = [
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

// Minimum role required per route (routes not listed here are accessible to all authenticated users)
const routeRoles: Record<string, string> = {
  "/stylists": "MANAGER",
  "/shop": "MANAGER",
  "/expenses": "MANAGER",
  "/profit-loss": "MANAGER",
  "/reports": "MANAGER",
  "/payroll": "OWNER",
  "/settings": "MANAGER",
};

// Routes only for unauthenticated users
const authPaths = ["/login", "/signup", "/forgot-password"];

function hasMinRole(userRole: string, minRole: string): boolean {
  return (ROLE_LEVELS[userRole] ?? 0) >= (ROLE_LEVELS[minRole] ?? 0);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    // If onboarding not complete, redirect to onboarding instead of dashboard
    if (token.onboardingComplete === false) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // For authenticated users on protected paths (except /onboarding):
  // redirect to /onboarding if onboarding is not complete
  if (isProtectedPath && token && token.onboardingComplete === false) {
    const isOnboardingPath = pathname === "/onboarding" || pathname.startsWith("/onboarding/");
    if (!isOnboardingPath) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // Role-based page access control
  if (isProtectedPath && token) {
    const userRole = (token.role as string) || "ASSISTANT";
    // Find the matching route role requirement
    const matchedRoute = Object.keys(routeRoles).find(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
    if (matchedRoute) {
      const minRole = routeRoles[matchedRoute];
      if (!hasMinRole(userRole, minRole)) {
        return NextResponse.redirect(new URL("/access-denied", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled by their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon, manifest, icons, sw.js
     * - public booking pages (/book/*)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|favicon\\.svg|manifest\\.json|sw\\.js|icons|book).*)",
  ],
};
