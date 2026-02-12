// lib/portal-auth.ts
// JWT-based authentication for the client self-service portal

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const PORTAL_COOKIE = "portal-token";
const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export interface PortalToken {
  email: string;
  clientIds: string[];
}

export async function signPortalToken(payload: PortalToken): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyPortalToken(): Promise<PortalToken | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(PORTAL_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    return { email: payload.email as string, clientIds: payload.clientIds as string[] };
  } catch {
    return null;
  }
}

export function portalCookieName(): string {
  return PORTAL_COOKIE;
}

export function portalCookieOptions(token: string) {
  return {
    name: PORTAL_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  };
}
