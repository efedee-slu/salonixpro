// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetLink } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://salonixpro.com";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email (across all businesses)
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    // Always return success even if user not found (security)
    if (!user) {
      return NextResponse.json({
        message: "If an account exists, a password reset link has been sent",
      });
    }

    // Generate a 32-byte random token
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Store SHA-256 hash of the token (never store raw token in DB)
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Set 1-hour expiry
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Store token hash and expiry (do NOT modify passwordHash)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: tokenHash,
        resetTokenExpiresAt: expiresAt,
      },
    });

    // Build reset URL with raw token
    const resetUrl = `${APP_URL}/reset-password?token=${rawToken}`;

    // Send email with reset link
    await sendPasswordResetLink({
      to: email,
      firstName: user.firstName || "there",
      resetUrl,
    });

    return NextResponse.json({
      message: "If an account exists, a password reset link has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
