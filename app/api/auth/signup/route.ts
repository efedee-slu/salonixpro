// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Default business hours
const defaultBusinessHours = [
  { day: "Sunday", dayIndex: 0, isOpen: false, openTime: "09:00", closeTime: "17:00" },
  { day: "Monday", dayIndex: 1, isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Tuesday", dayIndex: 2, isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Wednesday", dayIndex: 3, isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Thursday", dayIndex: 4, isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Friday", dayIndex: 5, isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Saturday", dayIndex: 6, isOpen: true, openTime: "09:00", closeTime: "16:00" },
];

// Default service categories
const defaultServiceCategories = [
  { name: "Hair Care", icon: "✂️", sortOrder: 1 },
  { name: "Styling", icon: "💇", sortOrder: 2 },
  { name: "Color", icon: "🎨", sortOrder: 3 },
  { name: "Treatments", icon: "💆", sortOrder: 4 },
];

function generateSlug(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      businessName,
      ownerFirstName,
      ownerLastName,
      email,
      phone,
      password,
      city,
      country,
    } = body;

    // Validate required fields
    if (!businessName || !ownerFirstName || !email || !password) {
      return NextResponse.json(
        { error: "Business name, owner first name, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check if email is already in use
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = generateSlug(businessName);
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create business first
    const business = await prisma.business.create({
      data: {
        name: businessName,
        slug,
        email: email.toLowerCase(),
        phone: phone || null,
        city: city || null,
        country: country || "Saint Lucia",
        businessHours: defaultBusinessHours,
        subscriptionStatus: "TRIAL",
        trialEndsAt,
      },
    });

    // Create owner user
    const user = await prisma.user.create({
      data: {
        businessId: business.id,
        email: email.toLowerCase(),
        username: email.toLowerCase().split("@")[0],
        passwordHash,
        firstName: ownerFirstName,
        lastName: ownerLastName || null,
        phone: phone || null,
        role: "OWNER",
      },
    });

    // Create default service categories using createMany
    await prisma.serviceCategory.createMany({
      data: defaultServiceCategories.map(cat => ({
        businessId: business.id,
        name: cat.name,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      })),
    });

    // Create owner as a stylist
    const stylist = await prisma.stylist.create({
      data: {
        businessId: business.id,
        userId: user.id,
        firstName: ownerFirstName,
        lastName: ownerLastName || null,
        email: email.toLowerCase(),
        phone: phone || null,
        bio: "Owner",
      },
    });

    // Create default schedule using createMany
    const defaultSchedule = [
      { dayOfWeek: 0, isWorking: false, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 1, isWorking: true, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 2, isWorking: true, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 3, isWorking: true, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 4, isWorking: true, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 5, isWorking: true, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 6, isWorking: true, startTime: "09:00", endTime: "16:00" },
    ];

    await prisma.stylistSchedule.createMany({
      data: defaultSchedule.map(sched => ({
        stylistId: stylist.id,
        ...sched,
      })),
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      businessId: business.id,
      slug: business.slug,
      trialEndsAt: business.trialEndsAt,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
