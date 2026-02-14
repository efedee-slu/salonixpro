// app/api/beta-signup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBetaConfirmation, sendBetaAdminNotification } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, salonName, phone, country, salonSize, message } = body;

    // Validate required fields
    if (!name || !email || !salonName) {
      return NextResponse.json(
        { error: "Name, email, and salon name are required." },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Check for existing signup
    const existing = await prisma.betaSignup.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This email is already registered for the beta program." },
        { status: 409 }
      );
    }

    // Create beta signup
    const signup = await prisma.betaSignup.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        salonName: salonName.trim(),
        phone: phone?.trim() || null,
        country: country?.trim() || null,
        salonSize: salonSize || null,
        message: message?.trim() || null,
      },
    });

    // Send confirmation email to the applicant
    try {
      await sendBetaConfirmation({
        to: signup.email,
        name: signup.name,
        salonName: signup.salonName,
      });
    } catch (emailErr) {
      console.error("Failed to send beta confirmation email:", emailErr);
    }

    // Notify admin about new beta signup
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        await sendBetaAdminNotification({
          to: adminEmail,
          applicantName: signup.name,
          applicantEmail: signup.email,
          salonName: signup.salonName,
          phone: signup.phone,
          country: signup.country,
          salonSize: signup.salonSize,
          message: signup.message,
        });
      }
    } catch (emailErr) {
      console.error("Failed to send admin notification email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Beta signup submitted successfully!",
    });
  } catch (error) {
    console.error("Beta signup error:", error);
    return NextResponse.json(
      { error: "Failed to submit beta signup. Please try again." },
      { status: 500 }
    );
  }
}
