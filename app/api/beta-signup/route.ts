// app/api/beta-signup/route.ts
// Auto-approve: creates business account immediately on beta signup
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getCurrencyForCountry } from "@/lib/currencies";
import { sendBetaWelcome, sendBetaAdminNotification } from "@/lib/email";

// Default business hours (Mon-Sat)
const defaultBusinessHours = [
  { day: "Sunday", dayIndex: 0, isOpen: false, openTime: "09:00", closeTime: "17:00" },
  { day: "Monday", dayIndex: 1, isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Tuesday", dayIndex: 2, isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Wednesday", dayIndex: 3, isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Thursday", dayIndex: 4, isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Friday", dayIndex: 5, isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Saturday", dayIndex: 6, isOpen: true, openTime: "09:00", closeTime: "16:00" },
];

const defaultSchedule = [
  { dayOfWeek: 0, isWorking: false, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 1, isWorking: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 2, isWorking: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 3, isWorking: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 4, isWorking: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 5, isWorking: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 6, isWorking: true, startTime: "09:00", endTime: "16:00" },
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

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

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists as a user
    const existingUser = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered. Please log in instead." },
        { status: 409 }
      );
    }

    // Check for existing beta signup
    const existingSignup = await prisma.betaSignup.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingSignup) {
      return NextResponse.json(
        { error: "This email is already registered for the beta program." },
        { status: 409 }
      );
    }

    // Generate unique slug
    let baseSlug = generateSlug(salonName);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Generate temporary password
    const tempPassword = generatePassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Trial: 30 days (1 month beta)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // Parse name into first/last
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

    // Auto-set currency from country
    const selectedCountry = country?.trim() || "Saint Lucia";
    const currencyInfo = getCurrencyForCountry(selectedCountry);

    // Create business
    const business = await prisma.business.create({
      data: {
        name: salonName.trim(),
        slug,
        email: normalizedEmail,
        phone: phone?.trim() || null,
        country: selectedCountry,
        currency: currencyInfo.code,
        currencySymbol: currencyInfo.symbol,
        businessHours: defaultBusinessHours,
        subscriptionStatus: "TRIAL",
        trialEndsAt,
      },
    });

    // Create owner user
    const user = await prisma.user.create({
      data: {
        businessId: business.id,
        email: normalizedEmail,
        username: normalizedEmail.split("@")[0],
        passwordHash,
        firstName,
        lastName,
        phone: phone?.trim() || null,
        role: "OWNER",
        mustChangePassword: true,
      },
    });

    // Create owner as a stylist
    const stylist = await prisma.stylist.create({
      data: {
        businessId: business.id,
        userId: user.id,
        firstName,
        lastName,
        email: normalizedEmail,
        phone: phone?.trim() || null,
        bio: "Owner",
      },
    });

    // Create default schedule
    await prisma.stylistSchedule.createMany({
      data: defaultSchedule.map((sched) => ({
        stylistId: stylist.id,
        ...sched,
      })),
    });

    // Create beta signup record (auto-approved)
    await prisma.betaSignup.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        salonName: salonName.trim(),
        phone: phone?.trim() || null,
        country: selectedCountry,
        salonSize: salonSize || null,
        message: message?.trim() || null,
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });

    const bookingUrl = `https://salonixpro.com/book/${slug}`;

    // Send welcome email to the applicant
    try {
      await sendBetaWelcome({
        to: normalizedEmail,
        name: firstName,
        salonName: salonName.trim(),
        username: normalizedEmail,
        tempPassword,
        bookingUrl,
        trialEndsAt,
      });
    } catch (emailErr) {
      console.error("Failed to send beta welcome email:", emailErr);
    }

    // Notify admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || "admin@salonixpro.com";
      await sendBetaAdminNotification({
        to: adminEmail,
        applicantName: name.trim(),
        applicantEmail: normalizedEmail,
        salonName: salonName.trim(),
        phone: phone?.trim() || null,
        country: selectedCountry,
        salonSize: salonSize || null,
        message: message?.trim() || null,
      });
    } catch (emailErr) {
      console.error("Failed to send admin notification email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Your account has been created! Check your email for login details.",
    });
  } catch (error) {
    console.error("Beta signup error:", error);
    return NextResponse.json(
      { error: "Failed to submit beta signup. Please try again." },
      { status: 500 }
    );
  }
}
