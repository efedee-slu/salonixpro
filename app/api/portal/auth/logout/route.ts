// app/api/portal/auth/logout/route.ts
import { NextResponse } from "next/server";
import { portalCookieName } from "@/lib/portal-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: portalCookieName(),
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
