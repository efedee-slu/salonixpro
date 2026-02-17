// app/api/platform/beta/invite/route.ts
// Admin-initiated beta invitation - creates business account and sends invite email
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getCurrencyForCountry } from "@/lib/currencies";
import { sendBetaInvite } from "@/lib/email";

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
  const { error } = await requireSuperAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { email, salonName, ownerName, phone, betaDuration, personalMessage } = body;

    // Validate required fields
    if (!email || !salonName || !ownerName) {
      return NextResponse.json(
        { error: "Email, salon name, and owner name are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already has an account
    const existingUser = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "This email already has an account. Use Extend Trial instead." },
        { status: 409 }
      );
    }

    // Check for existing beta signup
    const existingSignup = await prisma.betaSignup.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingSignup) {
      return NextResponse.json(
        { error: "This email already has a beta signup record." },
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

    // Trial duration
    const days = betaDuration || 30;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + days);

    // Parse name
    const nameParts = ownerName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

    // Currency
    const currencyInfo = getCurrencyForCountry("Saint Lucia");

    // Create business
    const business = await prisma.business.create({
      data: {
        name: salonName.trim(),
        slug,
        email: normalizedEmail,
        phone: phone?.trim() || null,
        country: "Saint Lucia",
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

    // Create beta signup record
    await prisma.betaSignup.create({
      data: {
        name: ownerName.trim(),
        email: normalizedEmail,
        salonName: salonName.trim(),
        phone: phone?.trim() || null,
        referralSource: "admin-invite",
        status: "APPROVED",
        approvedAt: new Date(),
        message: personalMessage?.trim() || null,
      },
    });

    const bookingUrl = `https://salonixpro.com/book/${slug}`;

    // Send invite email
    try {
      await sendBetaInvite({
        to: normalizedEmail,
        name: firstName,
        salonName: salonName.trim(),
        username: normalizedEmail,
        tempPassword,
        bookingUrl,
        trialEndsAt,
        betaDays: days,
        personalMessage: personalMessage?.trim() || null,
      });
    } catch (emailErr) {
      console.error("Failed to send beta invite email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${normalizedEmail} for ${salonName.trim()}`,
      businessId: business.id,
    });
  } catch (err) {
    console.error("Beta invite error:", err);
    return NextResponse.json(
      { error: "Failed to send beta invitation. Please try again." },
      { status: 500 }
    );
  }
}
