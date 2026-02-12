// app/api/portal/auth/send-code/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPortalVerificationCode } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find clients with this email (across all businesses)
    const clients = await prisma.client.findMany({
      where: { email: normalizedEmail, isActive: true },
      select: { id: true, firstName: true },
    });

    // Always return success to prevent email enumeration
    if (clients.length === 0) {
      return NextResponse.json({ success: true });
    }

    // Delete any unused codes for this email (cleanup)
    await prisma.clientVerification.deleteMany({
      where: { email: normalizedEmail, used: false },
    });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store verification code (10 min expiry)
    await prisma.clientVerification.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Send verification email
    await sendPortalVerificationCode({
      to: normalizedEmail,
      code,
      clientName: clients[0].firstName,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending portal code:", error);
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
  }
}
