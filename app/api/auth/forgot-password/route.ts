// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate a readable temporary password
function generateTempPassword(): string {
  // Format: 3 letters + 4 numbers + 2 letters (e.g., ABC1234XY)
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Removed I and O to avoid confusion
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
    await resend.emails.send({
      from: "SalonixPro <noreply@salonixpro.com>",
      to: email,
      subject: "Your temporary password - SalonixPro",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <!-- Logo -->
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-flex; align-items: center; gap: 12px;">
                  <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #0d9488, #14b8a6); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 24px;">✂</span>
                  </div>
                  <span style="font-size: 24px; font-weight: bold; color: #1a1a1a;">SalonixPro</span>
                </div>
              </div>

              <!-- Content -->
              <h1 style="font-size: 24px; font-weight: bold; color: #1a1a1a; margin: 0 0 16px; text-align: center;">
                Your temporary password
              </h1>
              
              <p style="color: #666; margin: 0 0 24px; text-align: center;">
                Hi ${user.firstName || "there"},<br>
                We received a request to reset your password. Here's your temporary password:
              </p>

              <!-- Temporary Password Box -->
              <div style="background: #f0fdfa; border: 2px dashed #0d9488; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                <p style="color: #666; font-size: 14px; margin: 0 0 8px;">Your temporary password:</p>
                <p style="font-size: 32px; font-weight: bold; color: #0d9488; margin: 0; letter-spacing: 4px; font-family: monospace;">
                  ${tempPassword}
                </p>
              </div>

              <!-- Instructions -->
              <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
                  ⚠️ Important: You will be required to change this password when you log in.
                </p>
              </div>

              <!-- Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://salonixpro.com"}/login" style="display: inline-block; background: linear-gradient(135deg, #0d9488, #14b8a6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Sign In Now
                </a>
              </div>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">

              <!-- Footer -->
              <p style="color: #999; font-size: 13px; text-align: center; margin: 0;">
                If you didn't request this, please contact support immediately.<br>
                Someone may have access to your account.
              </p>
            </div>

            <!-- Brand footer -->
            <p style="color: #999; font-size: 12px; text-align: center; margin: 24px 0 0;">
              SalonixPro · One system. One salon. Total control.
            </p>
          </div>
        </body>
        </html>
      `,
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
