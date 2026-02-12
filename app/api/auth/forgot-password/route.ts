// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendPasswordReset } from "@/lib/email";

// Generate a readable temporary password
function generateTempPassword(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "0123456789";

  let password = "";
  for (let i = 0; i < 3; i++) {
    password += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 4; i++) {
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  for (let i = 0; i < 2; i++) {
    password += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  return password;
}

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
      include: { business: true },
    });

    // Always return success even if user not found (security)
    if (!user) {
      return NextResponse.json({
        message: "If an account exists, a temporary password has been sent",
      });
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Update user with temp password and flag to force change
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    // Send email with temporary password
    await sendPasswordReset({
      to: email,
      firstName: user.firstName || "there",
      tempPassword,
    });

    return NextResponse.json({
      message: "If an account exists, a temporary password has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
