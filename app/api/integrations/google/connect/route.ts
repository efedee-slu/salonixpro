// app/api/integrations/google/connect/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAuthUrl } from "@/lib/google-calendar";
import { randomBytes } from "crypto";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stylistId = searchParams.get("stylistId");

    if (!stylistId) {
      return NextResponse.json(
        { error: "stylistId is required" },
        { status: 400 }
      );
    }

    // Verify stylist belongs to this business
    const stylist = await prisma.stylist.findFirst({
      where: { id: stylistId, businessId: session.user.businessId },
    });

    if (!stylist) {
      return NextResponse.json(
        { error: "Stylist not found" },
        { status: 404 }
      );
    }

    // Generate CSRF token
    const csrfToken = randomBytes(32).toString("hex");

    // Generate auth URL
    const authUrl = getAuthUrl(stylistId, csrfToken);

    // Set CSRF cookie and redirect
    const response = NextResponse.redirect(authUrl);
    response.cookies.set("google_oauth_csrf", csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error initiating Google OAuth:", error);
    return NextResponse.json(
      { error: "Failed to initiate Google Calendar connection" },
      { status: 500 }
    );
  }
}
