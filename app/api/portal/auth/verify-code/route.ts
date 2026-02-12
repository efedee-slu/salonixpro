// app/api/portal/auth/verify-code/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signPortalToken, portalCookieOptions } from "@/lib/portal-auth";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find the latest unused verification code for this email
    const verification = await prisma.clientVerification.findFirst({
      where: {
        email: normalizedEmail,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    // Check attempt limit
    if (verification.attempts >= 5) {
      return NextResponse.json({ error: "Too many attempts. Please request a new code." }, { status: 400 });
    }

    // Increment attempts
    await prisma.clientVerification.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });

    // Verify code
    if (verification.code !== code.trim()) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // Mark code as used
    await prisma.clientVerification.update({
      where: { id: verification.id },
      data: { used: true },
    });

    // Find all client records for this email
    const clients = await prisma.client.findMany({
      where: { email: normalizedEmail, isActive: true },
      select: { id: true },
    });

    if (clients.length === 0) {
      return NextResponse.json({ error: "No account found" }, { status: 404 });
    }

    // Sign JWT and set cookie
    const token = await signPortalToken({
      email: normalizedEmail,
      clientIds: clients.map((c) => c.id),
    });

    const cookieOpts = portalCookieOptions(token);
    const response = NextResponse.json({ success: true });
    response.cookies.set(cookieOpts);

    return response;
  } catch (error) {
    console.error("Error verifying portal code:", error);
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 });
  }
}
