// middleware.ts
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const protectedPaths = [
  "/dashboard",
  "/appointments",
  "/clients",
  "/services",
  "/stylists",
  "/shop",
  "/orders",
  "/reports",
  "/settings",
];

// Routes only for unauthenticated users
const authPaths = ["/login", "/signup", "/forgot-password"];

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
    return NextResponse.redirect(new URL("/dashboard", request.url));
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
